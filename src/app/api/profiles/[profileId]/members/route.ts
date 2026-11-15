import { NextResponse } from "next/server";
import { verifyServerAuthToken } from "@/lib/auth/server-verify";
import { adminVerifyProfileAccess } from "@/lib/server/firestore-admin";
import { getAdminDb } from "@/lib/firebase/admin";
import { CareProfileMembership } from "@/lib/types/membership";
import { ROLE_PERMISSIONS } from "@/lib/auth/rbac";
import { UserRole } from "@/lib/types/user";

/**
 * GET /api/profiles/[profileId]/members
 * Lists all active members of the care profile.
 * Requires "view_members" permission.
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
    const authCheck = await adminVerifyProfileAccess(authResult.user.uid, profileId, "view_members");
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || "Forbidden: You are not authorized to view members." },
        { status: authCheck.statusCode || 403 }
      );
    }

    const db = getAdminDb()!;
    const snap = await db.collection("memberships").where("profileId", "==", profileId).get();
    const members: CareProfileMembership[] = [];

    snap.forEach((mSnap) => {
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

    return NextResponse.json({ success: true, members });
  } catch (err: any) {
    console.error("GET /api/profiles/[profileId]/members error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load profile members" },
      { status: err.statusCode || 500 }
    );
  }
}
