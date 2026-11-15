import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminGetAppointment,
  adminSaveAppointment,
  adminDeleteAppointment,
} from "@/lib/server/firestore-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/profiles/[profileId]/appointments/[appointmentId]
 * Fetches a single appointment by ID.
 * Requires "view_appointments" permission.
 */
export async function GET(
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
    const authCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "view_appointments");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Cannot view appointment." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const appointment = await adminGetAppointment(profileId, appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, appointment });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId]/appointments/[appointmentId] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load appointment" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * PATCH /api/profiles/[profileId]/appointments/[appointmentId]
 * Partially updates an existing appointment.
 * Requires "manage_appointments" permission.
 */
export async function PATCH(
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
        { error: authCheck.error || "Forbidden: Your role does not permit modifying appointments." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const existing = await adminGetAppointment(profileId, appointmentId);
    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updated = await adminSaveAppointment(profileId, {
      ...existing,
      ...body,
      id: appointmentId,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    console.error("PATCH /api/profiles/[profileId]/appointments/[appointmentId] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update appointment" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/profiles/[profileId]/appointments/[appointmentId]
 * Replaces/updates an existing appointment.
 * Requires "manage_appointments" permission.
 */
export async function PUT(
  req: Request,
  { params }: { params: { profileId: string; appointmentId: string } }
) {
  return PATCH(req, { params });
}

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
