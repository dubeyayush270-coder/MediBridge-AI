import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import { adminVerifyProfileAccess } from "@/lib/server/firestore-admin";
import { processCareProfileNotifications } from "@/lib/server/notification-processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/check-now
 * On-demand notification check for the authenticated user's active care profile.
 */
export async function POST(req: Request) {
  try {
    const authResult = await verifyServerAuthToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, code: authResult.code },
        { status: authResult.status }
      );
    }

    const body = await req.json().catch(() => ({}));
    const profileId = body.profileId?.trim();

    if (!profileId) {
      return NextResponse.json(
        { error: "Bad Request: profileId is required" },
        { status: 400 }
      );
    }

    // Verify authorized membership in profile
    const accessCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId);
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.error || "Forbidden" },
        { status: accessCheck.statusCode || 403 }
      );
    }

    const stats = await processCareProfileNotifications(profileId);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err: any) {
    console.error("POST /api/notifications/check-now error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process notifications" },
      { status: 500 }
    );
  }
}
