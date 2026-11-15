import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminFetchAppointments,
  adminSaveAppointment,
} from "@/lib/server/firestore-admin";

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
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const { profileId } = params;
    const authCheck = await adminVerifyProfileAccess(authUser.uid, profileId, "view_appointments");
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
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const { profileId } = params;
    const authCheck = await adminVerifyProfileAccess(authUser.uid, profileId, "manage_appointments");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Your role does not permit modifying appointments." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Appointment title is required" }, { status: 400 });
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
