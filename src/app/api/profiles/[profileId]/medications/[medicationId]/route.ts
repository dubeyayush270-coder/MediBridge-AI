import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminGetMedication,
  adminSaveMedication,
  adminDeleteMedication,
} from "@/lib/server/firestore-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/profiles/[profileId]/medications/[medicationId]
 * Fetches a single medication by ID.
 * Requires "view_medications" permission.
 */
export async function GET(
  req: Request,
  { params }: { params: { profileId: string; medicationId: string } }
) {
  try {
    const authResult = await verifyServerAuthToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, code: authResult.code },
        { status: authResult.status }
      );
    }

    const { profileId, medicationId } = params;
    const authCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "view_medications");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Cannot view medication." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const medication = await adminGetMedication(profileId, medicationId);
    if (!medication) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, medication });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId]/medications/[medicationId] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load medication" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * PATCH /api/profiles/[profileId]/medications/[medicationId]
 * Partially updates an existing medication.
 * Requires "manage_medications" permission.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { profileId: string; medicationId: string } }
) {
  try {
    const authResult = await verifyServerAuthToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, code: authResult.code },
        { status: authResult.status }
      );
    }

    const { profileId, medicationId } = params;
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

    const existing = await adminGetMedication(profileId, medicationId);
    if (!existing) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    const updated = await adminSaveMedication(profileId, {
      ...existing,
      ...body,
      id: medicationId,
    });

    return NextResponse.json({ success: true, medication: updated });
  } catch (err: any) {
    console.error("PATCH /api/profiles/[profileId]/medications/[medicationId] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update medication" },
      { status: err.statusCode || 500 }
    );
  }
}

/**
 * PUT /api/profiles/[profileId]/medications/[medicationId]
 * Updates/replaces an existing medication.
 * Requires "manage_medications" permission.
 */
export async function PUT(
  req: Request,
  { params }: { params: { profileId: string; medicationId: string } }
) {
  return PATCH(req, { params });
}

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
    const authResult = await verifyServerAuthToken(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error, code: authResult.code },
        { status: authResult.status }
      );
    }

    const { profileId, medicationId } = params;
    const authCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "manage_medications");
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
