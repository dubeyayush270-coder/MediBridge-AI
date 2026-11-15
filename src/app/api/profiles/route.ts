import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  fetchCareProfilesForUser,
  createCareProfileInFirestore,
  getOrCreateUserDoc,
} from "@/lib/firebase/firestore";
import { CareProfile } from "@/lib/types/care-profile";

/**
 * GET /api/profiles
 * Fetches all care profiles the authenticated user is an authorized member of.
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

    const result = await fetchCareProfilesForUser(authUser.uid);
    return NextResponse.json({
      success: true,
      profiles: result.profiles,
      memberships: result.memberships,
    });
  } catch (err: any) {
    console.error("GET /api/profiles error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch care profiles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles
 * Creates a new care profile and registers the authenticated user as the creator/member.
 */
export async function POST(req: Request) {
  try {
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body.patientName || !body.patientName.trim()) {
      return NextResponse.json(
        { error: "Validation error: patientName is required" },
        { status: 400 }
      );
    }

    // Ensure user record exists
    const appUser = await getOrCreateUserDoc({
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName || null,
    });

    const result = await createCareProfileInFirestore(appUser, body);

    return NextResponse.json({
      success: true,
      profile: result.profile,
      membership: result.membership,
    });
  } catch (err: any) {
    console.error("POST /api/profiles error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create care profile" },
      { status: 500 }
    );
  }
}
