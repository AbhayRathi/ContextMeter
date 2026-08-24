import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { contextMeterMiddleware, respondWithAnswer } from "../middleware/express.js";
import type { ContextMeterClient } from "../client.js";
import type { LintResult } from "../wireTypes.js";

function makeClient(lintResult: LintResult): ContextMeterClient {
  return { lint: vi.fn().mockResolvedValue(lintResult) } as unknown as ContextMeterClient;
}

function makeLintResult(overrides: Partial<LintResult> = {}): LintResult {
  return {
    decisions: [],
    conflicts: [],
    summary: "ok",
    optimizedEstimatedTokens: 10,
    response: "answer",
    estimatedInputTokens: 10,
    evaluation: { passed: 1, total: 1, score: 100, results: [] },
    ...overrides,
  };
}

// A stand-in for an app-specific adapter: reads { task, contextBlocks } off
// req.body, which is one valid mapping among many getInput could implement.
const getInput = (req: Request) => req.body as { task: string; contextBlocks: never[] };

describe("contextMeterMiddleware", () => {
  it("attaches the gate result to res.locals and calls next() with no error by default", async () => {
    const client = makeClient(makeLintResult());
    const middleware = contextMeterMiddleware(client, { getInput });
    const req = { body: { task: "t", contextBlocks: [] } } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await middleware(req, res, next);

    expect(res.locals.contextMeter?.allowed).toBe(true);
    expect(next).toHaveBeenCalledWith();
  });

  it("does not block on conflicts unless policy.failOn.conflict is set", async () => {
    const client = makeClient(makeLintResult({ conflicts: [{ id: "c1" } as never] }));
    const middleware = contextMeterMiddleware(client, { getInput });
    const req = { body: { task: "t", contextBlocks: [] } } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await middleware(req, res, next);

    expect(res.locals.contextMeter?.allowed).toBe(true);
    expect(next).toHaveBeenCalledWith();
  });

  it("blocks via next(error) when a custom onResult acts on !result.allowed", async () => {
    const client = makeClient(makeLintResult({ conflicts: [{ id: "c1" } as never] }));
    const middleware = contextMeterMiddleware(client, {
      getInput,
      policy: { failOn: { conflict: true } },
      onResult: (result, { next }) => {
        if (!result.allowed) {
          next(new Error(result.failReasons.join("; ")));
          return;
        }
        next();
      },
    });
    const req = { body: { task: "t", contextBlocks: [] } } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("calls a custom onResult instead of the default annotate-and-continue behavior", async () => {
    const client = makeClient(makeLintResult());
    const onResult = vi.fn();
    const middleware = contextMeterMiddleware(client, { getInput, onResult });
    const req = { body: { task: "t", contextBlocks: [] } } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await middleware(req, res, next);

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards errors from a failing client to next()", async () => {
    const client = {
      lint: vi.fn().mockRejectedValue(new Error("network down")),
    } as unknown as ContextMeterClient;
    const middleware = contextMeterMiddleware(client, { getInput });
    const req = { body: { task: "t", contextBlocks: [] } } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("respondWithAnswer", () => {
  function makeRes() {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;
    return { res, status, json };
  }

  it("responds 200 with the optimized answer when allowed", () => {
    const { res, status, json } = makeRes();
    const result = { ...makeLintResult(), allowed: true, failReasons: [] };

    respondWithAnswer()(result, { req: {} as Request, res, next: vi.fn() as unknown as NextFunction });

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ answer: "answer", allowed: true, failReasons: [] })
    );
  });

  it("responds with the configured blockedStatusCode when not allowed", () => {
    const { res, status } = makeRes();
    const result = { ...makeLintResult(), allowed: false, failReasons: ["bad context"] };

    respondWithAnswer({ blockedStatusCode: 409 })(result, {
      req: {} as Request,
      res,
      next: vi.fn() as unknown as NextFunction,
    });

    expect(status).toHaveBeenCalledWith(409);
  });

  it("defaults the blocked status code to 422", () => {
    const { res, status } = makeRes();
    const result = { ...makeLintResult(), allowed: false, failReasons: ["bad context"] };

    respondWithAnswer()(result, { req: {} as Request, res, next: vi.fn() as unknown as NextFunction });

    expect(status).toHaveBeenCalledWith(422);
  });
});
