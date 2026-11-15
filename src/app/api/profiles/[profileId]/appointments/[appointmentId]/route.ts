import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminDeleteAppointment,
} from "@/lib/server/firestore-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/profiles/[profileId]/appointments/[appointmentId]
 * Deletes an appointment.
 * Requires "manage_appointments" permission.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { profileId: string; appointmentId: string } }
) {
  try {
    const authResult = await verifyServerAuthToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, code: authResult.code },
        { status: authResult.status }
      );
    }

    const { profileId, appointmentId } = params;
    const authCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "manage_appointments");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Your role does not permit deleting appointments." },
        { status: authCheck.statusCode || 403 }
      );
    }

    await adminDeleteAppointment(profileId, appointmentId);
    return NextResponse.json({ success: true, deleted: true });
  } catch (err: any) {
    console.error("DELETE /api/profiles/[profileId]/appointments/[appointmentId] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete appointment" },
      { status: err.statusCode || 500 }
    );
  }
}
