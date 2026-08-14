import pino from "pino";

// pino-pretty spawns a worker thread, which breaks on Vercel's serverless
// runtime — pretty-print in dev only, structured JSON lines in production.
export const logger = pino(
  process.env.NODE_ENV === "development"
    ? { transport: { target: "pino-pretty" } }
    : {},
);
