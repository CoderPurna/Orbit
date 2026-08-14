import { NextResponse } from "next/server";
import { runAiPipeline } from "@/lib/ai/pipeline";
import { requireCronSecret } from "@/lib/cron-auth";
import { apiInternalError } from "@/lib/api-error";

async function run(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  try {
    const result = await runAiPipeline();
    return NextResponse.json(result);
  } catch (error) {
    return apiInternalError("cron/ai-pump", error);
  }
}

// Vercel Cron invokes GET; both verbs are guarded by the cron secret.
export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
