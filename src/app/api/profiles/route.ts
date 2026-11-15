import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminFetchProfilesForUser,
  adminCreateCareProfile,
  adminGetOrCreateUserDoc,
} from "@/lib/server/firestore-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/profiles
 * Fetches all care profiles the authenticated user is an authorized active member of.
 */
export async function GET(req: Request) {
  try {
    const authResult = await verifyServerAuthToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, code: authResult.code },
        { status: authResult.status }
      );
    }

    const result = await adminFetchProfilesForUser(authResult.user.uid);
    return NextResponse.json({
      success: true,
      profiles: result.profiles,
      memberships: result.memberships,
    });
  } catch (err: any) {
    console.error("GET /api/profiles error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch care profiles" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * POST /api/profiles
 * Creates a new care profile and registers the authenticated user as the creator.
 * Automatically stores an initial caregiver invitation code in the protected server collection.
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

    const body = await req.json();
    if (!body.patientName || !body.patientName.trim()) {
      return NextResponse.json(
        { error: "Validation error: patientName is required" },
        { status: 400 }
      );
    }

    const appUser = await adminGetOrCreateUserDoc({
      uid: authResult.user.uid,
      email: authResult.user.email,
      displayName: authResult.user.displayName || null,
    });

    const result = await adminCreateCareProfile(appUser, body);

    return NextResponse.json({
      success: true,
      profile: result.profile,
      membership: result.membership,
      initialInvitationCode: result.initialInvitationCode,
    });
  } catch (err: any) {
    console.error("POST /api/profiles error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create care profile" },
      { status: err.statusCode || 500 }
    );
  }
}
