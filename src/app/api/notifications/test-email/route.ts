import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import { adminGetUserDoc } from "@/lib/server/firestore-admin";
import { adminSendTestNotification } from "@/lib/server/notification-processor";
import { getEmailProviderConfig } from "@/lib/server/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/test-email
 * Sends a real test verification email to the authenticated user's address.
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

    // Check if email provider is configured
    const { isConfigured, from } = getEmailProviderConfig();
    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: "Email Provider Not Configured: Please set RESEND_API_KEY in your environment variables.",
          code: "EMAIL_PROVIDER_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const userDoc = await adminGetUserDoc(authResult.user.uid);
    const targetUser = userDoc || {
      uid: authResult.user.uid,
      email: authResult.user.email,
      displayName: authResult.user.displayName || "Care Member",
      role: "elderly_patient",
      accessibleProfileIds: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const res = await adminSendTestNotification(targetUser, profileId);

    if (!res.success) {
      return NextResponse.json(
        {
          success: false,
          error: res.error || "Failed to dispatch test email",
          code: "DISPATCH_FAILED",
        },
        { status: res.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: res.messageId,
      deliveredTo: targetUser.email,
      sentFrom: from,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("POST /api/notifications/test-email error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}
