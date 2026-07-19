import type { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown[];
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? "INTERNAL_SERVER_ERROR";
  const message = err.message ?? "An unexpected error occurred";

  if (statusCode >= 500) {
    console.error("[ErrorHandler]", err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      details: err.details ?? [],
    },
  });
}

export function createError(
  message: string,
  statusCode: number,
  code: string,
  details?: unknown[]
): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.code = code;
  err.details = details;
  return err;
}
