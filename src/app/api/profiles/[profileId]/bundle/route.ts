import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import {
  adminVerifyProfileAccess,
  adminGetCareProfile,
  adminFetchMedications,
  adminFetchAppointments,
  adminFetchAdherenceLogs,
  adminFetchMembershipsForUser,
} from "@/lib/server/firestore-admin";
import { getAdminDb } from "@/lib/firebase/admin";
import { CareProfileMembership } from "@/lib/types/membership";
import { ROLE_PERMISSIONS } from "@/lib/auth/rbac";
import { UserRole } from "@/lib/types/user";

/**
 * GET /api/profiles/[profileId]/bundle
 * Consolidated profile data fetch (profile, medications, appointments, adherenceLogs, care circle)
 * Protected by server-side identity & membership authorization.
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
    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const authCheck = await adminVerifyProfileAccess(authUser.uid, profileId, "view_profile");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: You are not an active member of this care profile." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const profile = await adminGetCareProfile(profileId);
    if (!profile) {
      return NextResponse.json({ error: "Care profile not found" }, { status: 404 });
    }

    // Parallel fetch of medications, appointments, adherence, members
    const [medications, appointments, adherenceLogs] = await Promise.all([
      adminFetchMedications(profileId),
      adminFetchAppointments(profileId),
      adminFetchAdherenceLogs(profileId),
    ]);

    // Fetch members for this profile
    const db = getAdminDb()!;
    const membersSnap = await db.collection("memberships").where("profileId", "==", profileId).get();
    const members: CareProfileMembership[] = [];
    membersSnap.forEach((mSnap) => {
      const d = mSnap.data();
      members.push({
        id: mSnap.id,
        profileId: d.profileId,
        userId: d.userId,
        userEmail: d.userEmail || "",
        userName: d.userName || "Member",
        role: d.role,
        relationshipToPatient: d.relationshipToPatient || "Care Member",
        permissions: d.permissions || (d.role ? [...ROLE_PERMISSIONS[d.role as UserRole]] : []),
        status: d.status || "active",
        joinedAt: d.joinedAt || new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString(),
      });
    });

    return NextResponse.json({
      success: true,
      profile,
      membership: authCheck.membership,
      medications,
      appointments,
      adherenceLogs,
      members,
    });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId]/bundle error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load care bundle" },
      { status: err.statusCode || 500 }
    );
  }
}
