import { NextResponse } from "next/server";
import { processAllEligibleProfiles } from "@/lib/server/notification-processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Shared handler for scheduler notification processing.
 * Supports both GET (used by Vercel Cron) and POST (used by external schedulers).
 *
 * Authentication:
 * Requires Bearer token matching CRON_SECRET or NOTIFICATION_PROCESSOR_SECRET.
 * Rejects unauthenticated requests with 401 Unauthorized.
 */
async function handleSchedulerInvocation(req: Request) {
  const cronSecret = (
    process.env.CRON_SECRET ||
    process.env.NOTIFICATION_PROCESSOR_SECRET ||
    ""
  ).trim();

  // Extract auth header
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const xCronHeader = req.headers.get("x-cron-secret");

  let providedSecret = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    providedSecret = authHeader.substring(7).trim();
  } else if (xCronHeader) {
    providedSecret = xCronHeader.trim();
  }

  // If CRON_SECRET is not configured on the server, fail securely
  if (!cronSecret) {
    console.error("[NotificationProcessor] CRON_SECRET is not configured on the server.");
    return NextResponse.json(
      {
        error: "Server Configuration Error: CRON_SECRET is not configured.",
        code: "CRON_SECRET_UNCONFIGURED",
      },
      { status: 503 }
    );
  }

  // Validate secret
  if (!providedSecret || providedSecret !== cronSecret) {
    console.warn("[NotificationProcessor] Unauthorized scheduler invocation attempt.");
    return NextResponse.json(
      {
        error: "Unauthorized: Invalid or missing scheduler secret.",
        code: "UNAUTHORIZED_SCHEDULER",
      },
      { status: 401 }
    );
  }

  try {
    const result = await processAllEligibleProfiles({ limit: 50 });
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    console.error("[NotificationProcessor] Execution failure:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error during notification processing",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/process
 * Invoked by Vercel Scheduled Cron jobs.
 */
export async function GET(req: Request) {
  return handleSchedulerInvocation(req);
}

/**
 * POST /api/notifications/process
 * Invoked by external cron schedulers and manual triggers.
 */
export async function POST(req: Request) {
  return handleSchedulerInvocation(req);
}
