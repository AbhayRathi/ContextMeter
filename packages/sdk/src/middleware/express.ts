import type { NextFunction, Request, Response } from "express";
import type { ContextBlock } from "@context-meter/shared";
import type { ContextMeterClient } from "../client.js";
import { runContextGate } from "../runtime.js";
import type { ContextGatePolicy, ContextGateResult } from "../runtime.js";

declare module "express-serve-static-core" {
  interface Locals {
    contextMeter?: ContextGateResult;
  }
}

export interface ContextMeterRequestContext {
  req: Request;
  res: Response;
  next: NextFunction;
}

export interface ContextMeterMiddlewareOptions {
  /**
   * Maps this app's own request shape onto ContextMeter's canonical
   * { task, contextBlocks } input. Required, not defaulted — the whole point
   * of this middleware is that ContextMeter adapts to however the caller's
   * app already represents context (a LangChain message history, a custom
   * RAG pipeline's retrieved chunks, whatever), not the other way around.
   */
  getInput: (req: Request) => { task: string; contextBlocks: ContextBlock[] };
  policy?: ContextGatePolicy;
  /**
   * What to do with the gate result. Defaults to attaching it to
   * res.locals.contextMeter and always calling next() — purely
   * observational, safe to drop into any route. Override to block on
   * `!result.allowed`, or to respond immediately with the optimized answer
   * (see respondWithAnswer below) instead of letting the rest of the
   * pipeline run on the original, unreviewed context.
   */
  onResult?: (result: ContextGateResult, ctx: ContextMeterRequestContext) => void | Promise<void>;
}

const defaultOnResult: NonNullable<ContextMeterMiddlewareOptions["onResult"]> = (
  result,
  { res, next }
) => {
  res.locals.contextMeter = result;
  next();
};

/**
 * Express middleware wrapping runContextGate(). Calls the same engine and
 * the same failOn policy the CLI's regression gate uses, but mid-request
 * instead of pre-deploy — e.g. lint an agent's assembled context right
 * before it's sent to the model.
 */
export function contextMeterMiddleware(
  client: ContextMeterClient,
  options: ContextMeterMiddlewareOptions
) {
  const onResult = options.onResult ?? defaultOnResult;

  return async function contextMeter(req: Request, res: Response, next: NextFunction) {
    try {
      const input = options.getInput(req);
      const result = await runContextGate(client, input, options.policy);
      await onResult(result, { req, res, next });
    } catch (err) {
      next(err as Error);
    }
  };
}

/**
 * Ready-made onResult: skip the rest of the pipeline and respond immediately
 * with ContextMeter's own optimized answer. For the "just answer with clean
 * context, right here, at runtime" case — pass this as onResult and the
 * route becomes a working endpoint with no custom glue.
 */
export function respondWithAnswer(options: { blockedStatusCode?: number } = {}) {
  return function respond(result: ContextGateResult, { res }: ContextMeterRequestContext) {
    res.status(result.allowed ? 200 : (options.blockedStatusCode ?? 422)).json({
      answer: result.response,
      allowed: result.allowed,
      failReasons: result.failReasons,
      evaluation: result.evaluation,
      conflicts: result.conflicts,
    });
  };
}
