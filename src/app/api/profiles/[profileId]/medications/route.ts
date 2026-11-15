import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminFetchMedications,
  adminSaveMedication,
} from "@/lib/server/firestore-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/profiles/[profileId]/medications
 * Fetches all medications for the profile.
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
        { error: authCheck.error || "Forbidden: Cannot view medications." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const medications = await adminFetchMedications(profileId);
    return NextResponse.json({ success: true, medications });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId]/medications error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load medications" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * POST /api/profiles/[profileId]/medications
 * Adds or updates a medication record.
 * Requires "manage_medications" permission.
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
    const authCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "manage_medications");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Your role does not permit modifying medications." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Medication name is required" }, { status: 400 });
    }
    if (!body.dosage || typeof body.dosage !== "string" || !body.dosage.trim()) {
      return NextResponse.json({ error: "Prescribed dosage is required" }, { status: 400 });
    }

    const saved = await adminSaveMedication(profileId, body);
    return NextResponse.json({ success: true, medication: saved });
  } catch (err: any) {
    console.error("POST /api/profiles/[profileId]/medications error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save medication" },
      { status: err.statusCode || 500 }
    );
  }
}
