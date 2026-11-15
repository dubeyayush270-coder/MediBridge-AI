import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminFetchAppointments,
  adminSaveAppointment,
} from "@/lib/server/firestore-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/profiles/[profileId]/appointments
 * Fetches all appointments for the profile.
 * Requires "view_appointments" permission.
 */
export async function GET(
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
    const authCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "view_appointments");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Cannot view appointments." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const appointments = await adminFetchAppointments(profileId);
    return NextResponse.json({ success: true, appointments });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId]/appointments error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load appointments" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * POST /api/profiles/[profileId]/appointments
 * Creates or updates an appointment.
 * Requires "manage_appointments" permission.
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
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Appointment title is required" }, { status: 400 });
    }
    if (!body.doctorName || typeof body.doctorName !== "string" || !body.doctorName.trim()) {
      return NextResponse.json({ error: "Doctor name is required" }, { status: 400 });
    }
    if (!body.dateTime || isNaN(new Date(body.dateTime).getTime())) {
      return NextResponse.json({ error: "Valid appointment date and time is required" }, { status: 400 });
    }

    const saved = await adminSaveAppointment(profileId, body);
    return NextResponse.json({ success: true, appointment: saved });
  } catch (err: any) {
    console.error("POST /api/profiles/[profileId]/appointments error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save appointment" },
      { status: err.statusCode || 500 }
    );
  }
}
