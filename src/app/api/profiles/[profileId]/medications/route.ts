import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminFetchMedications,
  adminSaveMedication,
} from "@/lib/server/firestore-admin";

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
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const { profileId } = params;
    const authCheck = await adminVerifyProfileAccess(authUser.uid, profileId, "view_medications");
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
    const authUser = await verifyServerAuthToken(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authentication token" },
        { status: 401 }
      );
    }

    const { profileId } = params;
    const authCheck = await adminVerifyProfileAccess(authUser.uid, profileId, "manage_medications");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: Your role does not permit modifying medications." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Medication name is required" }, { status: 400 });
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
