import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminFetchAdherenceLogs,
  adminLogAdherenceDose,
  adminGetOrCreateUserDoc,
} from "@/lib/server/firestore-admin";

/**
 * GET /api/profiles/[profileId]/adherence
 * Fetches medication adherence logs.
 * Requires "view_medications" permission.
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
    const authCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "view_medications");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Cannot view adherence logs." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const adherenceLogs = await adminFetchAdherenceLogs(profileId);
    return NextResponse.json({ success: true, adherenceLogs });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId]/adherence error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load adherence logs" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * POST /api/profiles/[profileId]/adherence
 * Logs dose taken or skipped.
 * Requires "log_adherence" permission.
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
    const authCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "log_adherence");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Your role does not permit logging adherence." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const body = await req.json();
    if (!body.medicationId || !body.status) {
      return NextResponse.json(
        { error: "medicationId and status ('taken' | 'skipped' | 'missed') are required." },
        { status: 400 }
      );
    }

    const appUser = await adminGetOrCreateUserDoc({
      uid: authResult.user.uid,
      email: authResult.user.email,
      displayName: authResult.user.displayName || null,
    });

    const log = await adminLogAdherenceDose(profileId, appUser, {
      id: body.id,
      medicationId: body.medicationId,
      medicationName: body.medicationName || "Medication",
      dosage: body.dosage || "1 dose",
      scheduledTime: body.scheduledTime || "08:00",
      scheduledDate: body.scheduledDate || new Date().toISOString().split("T")[0],
      status: body.status,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    console.error("POST /api/profiles/[profileId]/adherence error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to log adherence dose" },
      { status: err.statusCode || 500 }
    );
  }
}
