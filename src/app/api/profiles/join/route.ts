import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import { joinProfileWithPasscodeInFirestore, getOrCreateUserDoc } from "@/lib/firebase/firestore";

/**
 * POST /api/profiles/join
 * Links an authenticated user to an existing profile using a secure passcode.
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
    const { profileId, passcode } = body;

    if (!profileId || !passcode) {
      return NextResponse.json(
        { error: "Both profileId and passcode are required" },
        { status: 400 }
      );
    }

    const appUser = await getOrCreateUserDoc({
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName || null,
    });

    const result = await joinProfileWithPasscodeInFirestore(
      appUser,
      profileId.trim(),
      passcode.trim()
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Join failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profile: result.profile,
      membership: result.membership,
    });
  } catch (err: any) {
    console.error("POST /api/profiles/join error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to link profile" },
      { status: 500 }
    );
  }
}
