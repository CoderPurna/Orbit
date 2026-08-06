import { NextResponse } from "next/server";
import { runAiPipeline } from "@/lib/ai/pipeline";

export async function POST() {
  try {
    const result = await runAiPipeline();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "AI pipeline execution failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const result = await runAiPipeline();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "AI pipeline execution failed" },
      { status: 500 },
    );
  }
}
