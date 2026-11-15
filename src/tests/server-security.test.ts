import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getMeRoute, PATCH as patchMeRoute } from "../app/api/users/me/route";
import { GET as getProfilesRoute, POST as postProfilesRoute } from "../app/api/profiles/route";
import { GET as getSingleProfileRoute } from "../app/api/profiles/[profileId]/route";
import { POST as postJoinRoute } from "../app/api/profiles/join/route";
import { GET as getMedicationsRoute, POST as postMedicationsRoute } from "../app/api/profiles/[profileId]/medications/route";
import { GET as getAppointmentsRoute, POST as postAppointmentsRoute } from "../app/api/profiles/[profileId]/appointments/route";
import { GET as getAdherenceRoute, POST as postAdherenceRoute } from "../app/api/profiles/[profileId]/adherence/route";
import { POST as postInvitationRoute } from "../app/api/profiles/[profileId]/invitations/route";
import * as serverVerify from "../lib/auth/server-verify";
import * as firestoreAdmin from "../lib/server/firestore-admin";
import { hasPermission } from "../lib/auth/rbac";

describe("PHASE 5 — Server Security & Negative Authorization Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Unauthenticated Requests (401 Unauthorized)", () => {
    it("rejects unauthenticated GET /api/users/me with 401", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(null);
      const req = new Request("http://localhost:3000/api/users/me");
      const res = await getMeRoute(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("rejects unauthenticated GET /api/profiles with 401", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(null);
      const req = new Request("http://localhost:3000/api/profiles");
      const res = await getProfilesRoute(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("rejects unauthenticated POST /api/profiles with 401", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(null);
      const req = new Request("http://localhost:3000/api/profiles", {
        method: "POST",
        body: JSON.stringify({ patientName: "Test Patient" }),
      });
      const res = await postProfilesRoute(req);
      expect(res.status).toBe(401);
    });

    it("rejects unauthenticated GET /api/profiles/[profileId] with 401", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(null);
      const req = new Request("http://localhost:3000/api/profiles/profile-123");
      const res = await getSingleProfileRoute(req, { params: { profileId: "profile-123" } });
      expect(res.status).toBe(401);
    });

    it("rejects unauthenticated POST /api/profiles/join with 401", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(null);
      const req = new Request("http://localhost:3000/api/profiles/join", {
        method: "POST",
        body: JSON.stringify({ profileId: "profile-123", passcode: "CARE26" }),
      });
      const res = await postJoinRoute(req);
      expect(res.status).toBe(401);
    });

    it("rejects unauthenticated GET & POST /api/profiles/[profileId]/medications with 401", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(null);
      const getReq = new Request("http://localhost:3000/api/profiles/profile-123/medications");
      const getRes = await getMedicationsRoute(getReq, { params: { profileId: "profile-123" } });
      expect(getRes.status).toBe(401);

      const postReq = new Request("http://localhost:3000/api/profiles/profile-123/medications", {
        method: "POST",
        body: JSON.stringify({ name: "Aspirin" }),
      });
      const postRes = await postMedicationsRoute(postReq, { params: { profileId: "profile-123" } });
      expect(postRes.status).toBe(401);
    });

    it("rejects unauthenticated GET & POST /api/profiles/[profileId]/appointments with 401", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(null);
      const getReq = new Request("http://localhost:3000/api/profiles/profile-123/appointments");
      const getRes = await getAppointmentsRoute(getReq, { params: { profileId: "profile-123" } });
      expect(getRes.status).toBe(401);

      const postReq = new Request("http://localhost:3000/api/profiles/profile-123/appointments", {
        method: "POST",
        body: JSON.stringify({ title: "Cardiology Consult" }),
      });
      const postRes = await postAppointmentsRoute(postReq, { params: { profileId: "profile-123" } });
      expect(postRes.status).toBe(401);
    });

    it("rejects unauthenticated GET & POST /api/profiles/[profileId]/adherence with 401", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(null);
      const getReq = new Request("http://localhost:3000/api/profiles/profile-123/adherence");
      const getRes = await getAdherenceRoute(getReq, { params: { profileId: "profile-123" } });
      expect(getRes.status).toBe(401);

      const postReq = new Request("http://localhost:3000/api/profiles/profile-123/adherence", {
        method: "POST",
        body: JSON.stringify({ medicationId: "med-1", status: "taken" }),
      });
      const postRes = await postAdherenceRoute(postReq, { params: { profileId: "profile-123" } });
      expect(postRes.status).toBe(401);
    });
  });

  describe("2. Unauthorized Cross-Profile Access (403 Forbidden)", () => {
    const maliciousUser = {
      uid: "intruder-user-bob",
      email: "bob.intruder@example.org",
      displayName: "Bob Intruder",
    };

    it("strictly blocks Bob from viewing Alice's profile (403 Forbidden)", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(maliciousUser);
      vi.spyOn(firestoreAdmin, "adminVerifyProfileAccess").mockResolvedValue({
        authorized: false,
        error: "Forbidden: You are not an authorized member of this care profile.",
        statusCode: 403,
      });

      const req = new Request("http://localhost:3000/api/profiles/profile-alice-private");
      const res = await getSingleProfileRoute(req, { params: { profileId: "profile-alice-private" } });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("strictly blocks Bob from viewing Alice's medications (403 Forbidden)", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(maliciousUser);
      vi.spyOn(firestoreAdmin, "adminVerifyProfileAccess").mockResolvedValue({
        authorized: false,
        error: "Forbidden: Cannot view medications.",
        statusCode: 403,
      });

      const req = new Request("http://localhost:3000/api/profiles/profile-alice-private/medications");
      const res = await getMedicationsRoute(req, { params: { profileId: "profile-alice-private" } });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("strictly blocks Bob from tampering with Alice's adherence logs (403 Forbidden)", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(maliciousUser);
      vi.spyOn(firestoreAdmin, "adminVerifyProfileAccess").mockResolvedValue({
        authorized: false,
        error: "Forbidden: Your role does not permit logging adherence.",
        statusCode: 403,
      });

      const req = new Request("http://localhost:3000/api/profiles/profile-alice-private/adherence", {
        method: "POST",
        body: JSON.stringify({ medicationId: "med-alice-heart", status: "taken" }),
      });
      const res = await postAdherenceRoute(req, { params: { profileId: "profile-alice-private" } });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });

    it("strictly blocks Bob from generating invitations on Alice's profile (403 Forbidden)", async () => {
      vi.spyOn(serverVerify, "verifyServerAuthToken").mockResolvedValue(maliciousUser);
      vi.spyOn(firestoreAdmin, "adminGetOrCreateUserDoc").mockResolvedValue({
        uid: maliciousUser.uid,
        email: maliciousUser.email,
        displayName: maliciousUser.displayName,
        role: "caregiver",
        accessibleProfileIds: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
      vi.spyOn(firestoreAdmin, "adminCreateInvitation").mockRejectedValue(
        new firestoreAdmin.AdminFirestoreError(
          "Forbidden: Your role (caregiver) lacks the required permission: invite_members.",
          403
        )
      );

      const req = new Request("http://localhost:3000/api/profiles/profile-alice-private/invitations", {
        method: "POST",
        body: JSON.stringify({ intendedRole: "caregiver" }),
      });
      const res = await postInvitationRoute(req, { params: { profileId: "profile-alice-private" } });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Forbidden");
    });
  });

  describe("3. Role Permissions & Server Policy Enforcement", () => {
    it("ensures caregiver role cannot perform invite_members or edit_profile", () => {
      const caregiverRole = "caregiver";
      expect(hasPermission(caregiverRole, "invite_members")).toBe(false);
      expect(hasPermission(caregiverRole, "edit_profile")).toBe(false);
      expect(hasPermission(caregiverRole, "delete_profile")).toBe(false);
    });

    it("ensures elderly_patient and family_member can invite care members", () => {
      expect(hasPermission("elderly_patient", "invite_members")).toBe(true);
      expect(hasPermission("family_member", "invite_members")).toBe(true);
    });
  });
});
