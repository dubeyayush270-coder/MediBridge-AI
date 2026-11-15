import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminGetOrCreateUserDoc,
  adminGetUserDoc,
  adminUpdateUserDoc,
} from "@/lib/server/firestore-admin";
import { UserRole } from "@/lib/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/users/me
 * Fetches or initializes the authenticated user record in Firestore.
 * Supports self-healing for accounts whose profile initialization was previously interrupted.
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

    const appUser = await adminGetOrCreateUserDoc({
      uid: authResult.user.uid,
      email: authResult.user.email,
      displayName: authResult.user.displayName || null,
    });

    return NextResponse.json({ success: true, user: appUser });
  } catch (err: any) {
    console.error("GET /api/users/me error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load user document", code: "SERVER_ERROR" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * POST /api/users/me
 * Explicitly initializes a new user record with designated role and display name during registration.
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
    const role: UserRole =
      body.role === "family_member" || body.role === "caregiver" || body.role === "elderly_patient"
        ? body.role
        : "elderly_patient";
    const displayName = body.displayName || authResult.user.displayName || null;

    const appUser = await adminGetOrCreateUserDoc(
      {
        uid: authResult.user.uid,
        email: authResult.user.email,
        displayName,
      },
      role
    );

    return NextResponse.json({ success: true, user: appUser });
  } catch (err: any) {
    console.error("POST /api/users/me error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initialize user record", code: "SERVER_ERROR" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * PATCH /api/users/me
 * Updates user preferences or active profile selection.
 */
export async function PATCH(req: Request) {
  try {
    const authResult = await verifyServerAuthToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, code: authResult.code },
        { status: authResult.status }
      );
    }

    const body = await req.json();
    const allowedUpdates: any = {};
    if (body.activeProfileId !== undefined) {
      allowedUpdates.activeProfileId = body.activeProfileId;
    }
    if (body.preferences !== undefined) {
      allowedUpdates.preferences = body.preferences;
    }
    if (body.displayName !== undefined) {
      allowedUpdates.displayName = body.displayName;
    }

    await adminUpdateUserDoc(authResult.user.uid, allowedUpdates);
    const updated = await adminGetUserDoc(authResult.user.uid);

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("PATCH /api/users/me error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update user document", code: "SERVER_ERROR" },
      { status: err.statusCode || 500 }
    );
  }
}
