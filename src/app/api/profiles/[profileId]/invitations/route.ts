import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminGetOrCreateUserDoc,
  adminCreateInvitation,
} from "@/lib/server/firestore-admin";

/**
 * POST /api/profiles/[profileId]/invitations
 * Creates a secure, time-limited, rate-limited passcode invitation.
 * Stores verifier in the server-only careProfileInvitations collection.
 */
export async function POST(
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
    const body = await req.json().catch(() => ({}));

    const appUser = await adminGetOrCreateUserDoc({
      uid: authResult.user.uid,
      email: authResult.user.email,
      displayName: authResult.user.displayName || null,
    });

    const invitation = await adminCreateInvitation(profileId, appUser, {
      intendedRole: body.intendedRole || "caregiver",
      relationship: body.relationship,
      expiresInHours: body.expiresInHours || 48,
      customCode: body.customCode,
    });

    return NextResponse.json({
      success: true,
      invitationId: invitation.invitationId,
      code: invitation.code,
      expiresAt: invitation.expiresAt,
      intendedRole: invitation.intendedRole,
    });
  } catch (err: any) {
    console.error("POST /api/profiles/[profileId]/invitations error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create invitation" },
      { status: err.statusCode || 500 }
    );
  }
}
