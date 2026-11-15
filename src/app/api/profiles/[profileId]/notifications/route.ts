import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import { adminVerifyProfileAccess, adminGetCareProfile } from "@/lib/server/firestore-admin";
import { adminFetchRecentNotifications } from "@/lib/server/notification-processor";
import { getAdminDb } from "@/lib/firebase/admin";
import { getEmailProviderConfig } from "@/lib/server/email-service";
import { DEFAULT_NOTIFICATION_PREFERENCES, NotificationPreferences } from "@/lib/types/notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/profiles/[profileId]/notifications
 * Fetches notification history and current preferences for the profile.
 */
export async function GET(
  req: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const authResult = await verifyServerAuthToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, code: authResult.code },
        { status: authResult.status }
      );
    }

    const { profileId } = params;
    const accessCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId);
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.error || "Forbidden" },
        { status: accessCheck.statusCode || 403 }
      );
    }

    const profile = await adminGetCareProfile(profileId);
    const notifications = await adminFetchRecentNotifications(profileId, 30);
    const providerConfig = getEmailProviderConfig();

    const preferences: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(profile?.notificationSettings || {}),
    };

    return NextResponse.json({
      success: true,
      preferences,
      notifications,
      emailProviderConfigured: providerConfig.isConfigured,
      senderAddress: providerConfig.from,
    });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId]/notifications error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch notification data" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profiles/[profileId]/notifications
 * Updates notification preferences for the care profile.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const authResult = await verifyServerAuthToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, code: authResult.code },
        { status: authResult.status }
      );
    }

    const { profileId } = params;
    const accessCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "edit_profile");
    if (!accessCheck.authorized) {
      return NextResponse.json(
        { error: accessCheck.error || "Forbidden: You lack edit_profile permission." },
        { status: accessCheck.statusCode || 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const newPreferences: Partial<NotificationPreferences> = body.preferences || body;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 503 }
      );
    }

    const profile = await adminGetCareProfile(profileId);
    const mergedPreferences: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(profile?.notificationSettings || {}),
      ...newPreferences,
    };

    await db.collection("careProfiles").doc(profileId).update({
      notificationSettings: mergedPreferences,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      preferences: mergedPreferences,
    });
  } catch (err: any) {
    console.error("PATCH /api/profiles/[profileId]/notifications error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
