import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import { fetchUserMemberships } from "@/lib/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

/**
 * GET /api/profiles/[profileId]
 * Fetches a single care profile with strict authorization check.
 * Rejects requests if user is not an active member.
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

    // Server-side Authorization: Verify calling user's membership in this profile
    const memberships = await fetchUserMemberships(authUser.uid);
    const hasMembership = memberships.some(
      (m) => m.profileId === profileId && m.status === "active"
    );

    if (!hasMembership) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view this patient's profile." },
        { status: 403 }
      );
    }

    if (!db) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const profRef = doc(db, "careProfiles", profileId);
    const snap = await getDoc(profRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Care profile not found" }, { status: 404 });
    }

    const data = snap.data();
    return NextResponse.json({
      success: true,
      profile: {
        id: snap.id,
        ...data,
      },
    });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId] error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
