import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminGetCareProfile,
} from "@/lib/server/firestore-admin";

/**
 * GET /api/profiles/[profileId]
 * Fetches a single care profile with strict server-side authorization check.
 * Rejects requests with 403 Forbidden if user is not an active member.
 */
export async function GET(
  req: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const { profileId } = params;
    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    // Strict Authorization Guard
    const authCheck = await adminVerifyProfileAccess(authUser.uid, profileId, "view_profile");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: You are not authorized to access this patient profile." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const profile = await adminGetCareProfile(profileId);
    if (!profile) {
      return NextResponse.json({ error: "Care profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile,
      membership: authCheck.membership,
    });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId] error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: err.statusCode || 500 }
    );
  }
}
