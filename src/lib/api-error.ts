import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Error convention per Architecture §10: `{ error: { code, message } }` with
 * stable machine-readable codes. Internal details go to the log, never to the
 * client.
 */
export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Catch-all for route handlers: log the real error, return a generic 500. */
export function apiInternalError(route: string, error: unknown) {
  logger.error({ route, err: error }, "unhandled route error");
  return apiError("internal_error", "Something went wrong on our side", 500);
}
