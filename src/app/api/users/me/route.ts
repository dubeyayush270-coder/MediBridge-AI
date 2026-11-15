import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminGetOrCreateUserDoc,
  adminGetUserDoc,
  adminUpdateUserDoc,
} from "@/lib/server/firestore-admin";

/**
 * GET /api/users/me
 * Fetches or initializes the authenticated user record in Firestore.
 */
export async function GET(req: Request) {
  try {
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const appUser = await adminGetOrCreateUserDoc({
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName || null,
    });

    return NextResponse.json({ success: true, user: appUser });
  } catch (err: any) {
    console.error("GET /api/users/me error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load user document" },
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
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
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

    await adminUpdateUserDoc(authUser.uid, allowedUpdates);
    const updated = await adminGetUserDoc(authUser.uid);

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error("PATCH /api/users/me error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update user document" },
      { status: err.statusCode || 500 }
    );
  }
}
