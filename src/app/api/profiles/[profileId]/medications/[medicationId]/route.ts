import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminDeleteMedication,
} from "@/lib/server/firestore-admin";

/**
 * DELETE /api/profiles/[profileId]/medications/[medicationId]
 * Deletes a medication record.
 * Requires "manage_medications" permission.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { profileId: string; medicationId: string } }
) {
  try {
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const { profileId, medicationId } = params;
    const authCheck = await adminVerifyProfileAccess(authUser.uid, profileId, "manage_medications");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Your role does not permit deleting medications." },
        { status: authCheck.statusCode || 403 }
      );
    }

    await adminDeleteMedication(profileId, medicationId);
    return NextResponse.json({ success: true, deleted: true });
  } catch (err: any) {
    console.error("DELETE /api/profiles/[profileId]/medications/[medicationId] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete medication" },
      { status: err.statusCode || 500 }
    );
  }
}
