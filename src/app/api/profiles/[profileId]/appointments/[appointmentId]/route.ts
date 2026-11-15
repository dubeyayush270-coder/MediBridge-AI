import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminDeleteAppointment,
} from "@/lib/server/firestore-admin";

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
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const { profileId, appointmentId } = params;
    const authCheck = await adminVerifyProfileAccess(authUser.uid, profileId, "manage_appointments");
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
