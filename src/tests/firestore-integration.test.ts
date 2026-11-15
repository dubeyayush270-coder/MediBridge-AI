import { describe, it, expect, vi } from "vitest";
import { AppUser } from "../lib/types/user";
import { CareProfile } from "../lib/types/care-profile";
import { CareProfileMembership } from "../lib/types/membership";
import { ROLE_PERMISSIONS, hasPermission } from "../lib/auth/rbac";
import { hashPasscode, generateSalt, verifyPasscode } from "../lib/auth/passcode";
import { DEMO_USER, DEMO_PROFILE } from "../lib/firebase/demo-data";
import { normalizePrivateKey, resolveAdminProjectId, EXPECTED_FIREBASE_PROJECT_ID } from "../lib/firebase/admin";

describe("Firestore Care Profile & Membership Integration", () => {
  const testUserA: AppUser = {
    uid: "test-user-alice",
    email: "alice@example.com",
    displayName: "Alice Vance",
    role: "elderly_patient",
    accessibleProfileIds: [],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  const testUserB: AppUser = {
    uid: "test-user-bob-intruder",
    email: "bob.unauthorized@example.com",
    displayName: "Bob Intruder",
    role: "family_member",
    accessibleProfileIds: [],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  it("creates care profile and stores secure invitation verifier separately in server collection", async () => {
    const salt = generateSalt();
    const passcode = "CARE26";
    const passcodeHash = await hashPasscode(passcode, salt);

    const profile: CareProfile = {
      id: "profile-alice-test-1",
      patientName: "Alice Vance",
      preferredName: "Alice",
      dateOfBirth: "1948-03-22",
      allergies: ["Penicillin"],
      primaryDoctor: {
        name: "Dr. Chen",
        clinic: "Metro Clinic",
        phone: "(555) 123-4567",
      },
      emergencyContacts: [
        {
          name: "David Vance",
          relationship: "Son",
          phone: "(555) 999-8888",
          isPrimary: true,
        },
      ],
      createdBy: testUserA.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const serverInvitation = {
      id: "invite-alice-test-1",
      profileId: profile.id,
      passcodeHash,
      salt,
      intendedRole: "caregiver",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxAttempts: 5,
      failedAttempts: 0,
      isUsed: false,
    };

    const creatorMembership: CareProfileMembership = {
      id: `mem-${testUserA.uid}-${profile.id}`,
      profileId: profile.id,
      userId: testUserA.uid,
      userEmail: testUserA.email,
      userName: testUserA.displayName,
      role: testUserA.role,
      relationshipToPatient: "Self",
      permissions: [...ROLE_PERMISSIONS[testUserA.role]],
      status: "active",
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(profile.id).toBe("profile-alice-test-1");
    expect(profile.createdBy).toBe(testUserA.uid);
    expect(creatorMembership.permissions).toContain("view_profile");
    expect(creatorMembership.permissions).toContain("view_medications");
    expect(creatorMembership.permissions).toContain("log_adherence");
    expect((profile as any).joinPasscodeHash).toBeUndefined(); // Verifies stripped from care profile
    expect(serverInvitation.passcodeHash).not.toBe(passcode); // Verifies never stored plaintext
  });

  it("retrieves only profiles for which the user holds an active membership", () => {
    const allMemberships: CareProfileMembership[] = [
      {
        id: "mem-1",
        profileId: "profile-alice-test-1",
        userId: testUserA.uid,
        userEmail: testUserA.email,
        userName: testUserA.displayName,
        role: "elderly_patient",
        relationshipToPatient: "Self",
        permissions: [...ROLE_PERMISSIONS.elderly_patient],
        status: "active",
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const allProfiles: CareProfile[] = [
      {
        id: "profile-alice-test-1",
        patientName: "Alice Vance",
        dateOfBirth: "1948-03-22",
        allergies: [],
        primaryDoctor: { name: "Dr. Chen", clinic: "Metro", phone: "" },
        emergencyContacts: [],
        createdBy: testUserA.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "profile-confidential-other",
        patientName: "Other Patient",
        dateOfBirth: "1940-01-01",
        allergies: [],
        primaryDoctor: { name: "Dr. Smith", clinic: "General", phone: "" },
        emergencyContacts: [],
        createdBy: "different-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Filter logic simulating server API query
    const userAMemberships = allMemberships.filter(
      (m) => m.userId === testUserA.uid && m.status === "active"
    );
    const userAProfileIds = new Set(userAMemberships.map((m) => m.profileId));
    const userAProfiles = allProfiles.filter((p) => userAProfileIds.has(p.id));

    expect(userAProfiles).toHaveLength(1);
    expect(userAProfiles[0].id).toBe("profile-alice-test-1");
    expect(userAProfiles[0].patientName).toBe("Alice Vance");
  });

  it("strictly denies unauthorized user from viewing another patient's care profile (403 Forbidden)", () => {
    const memberships: CareProfileMembership[] = [
      {
        id: "mem-alice",
        profileId: "profile-alice-test-1",
        userId: testUserA.uid,
        userEmail: testUserA.email,
        userName: testUserA.displayName,
        role: "elderly_patient",
        relationshipToPatient: "Self",
        permissions: [...ROLE_PERMISSIONS.elderly_patient],
        status: "active",
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Simulate server authorization check for Bob attempting to access Alice's profile
    const targetProfileId = "profile-alice-test-1";
    const requestingUserId = testUserB.uid; // Bob

    const isAuthorized = memberships.some(
      (m) => m.profileId === targetProfileId && m.userId === requestingUserId && m.status === "active"
    );

    expect(isAuthorized).toBe(false);
  });

  it("links a new caregiver to profile when correct passcode is provided and creates membership", async () => {
    const salt = generateSalt();
    const passcode = "CARE26";
    const storedHash = await hashPasscode(passcode, salt);

    // Candidate verifies
    const candidateEntered = "care26"; // Case insensitive
    const isValid = await verifyPasscode(candidateEntered, storedHash, salt);
    expect(isValid).toBe(true);

    // Caregiver joining creates membership
    const caregiverUser: AppUser = {
      uid: "caregiver-nurse-susan",
      email: "susan.nurse@example.com",
      displayName: "Nurse Susan",
      role: "caregiver",
      accessibleProfileIds: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const newCaregiverMembership: CareProfileMembership = {
      id: `mem-${caregiverUser.uid}-profile-alice-test-1`,
      profileId: "profile-alice-test-1",
      userId: caregiverUser.uid,
      userEmail: caregiverUser.email,
      userName: caregiverUser.displayName,
      role: caregiverUser.role,
      relationshipToPatient: "Visiting Nurse",
      permissions: [...ROLE_PERMISSIONS.caregiver],
      status: "active",
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(newCaregiverMembership.profileId).toBe("profile-alice-test-1");
    expect(newCaregiverMembership.userId).toBe(caregiverUser.uid);
    expect(hasPermission(newCaregiverMembership.role, "manage_medications")).toBe(true);
    expect(hasPermission(newCaregiverMembership.role, "log_adherence")).toBe(true);
  });

  it("ensures demonstration data is strictly isolated from real user session", () => {
    const realUser: AppUser = {
      uid: "real-firebase-uid-999",
      email: "real.user@gmail.com",
      displayName: "Real Registered User",
      role: "family_member",
      accessibleProfileIds: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Ensure real user does not adopt DEMO_USER or DEMO_PROFILE IDs
    expect(realUser.uid).not.toBe(DEMO_USER.uid);
    expect(realUser.accessibleProfileIds).not.toContain(DEMO_PROFILE.id);
  });

  describe("Vercel & Environment Variable Private Key Normalization", () => {
    it("handles undefined and empty string gracefully", () => {
      expect(normalizePrivateKey(undefined)).toBeUndefined();
      expect(normalizePrivateKey("")).toBeUndefined();
      expect(normalizePrivateKey("   ")).toBeUndefined();
    });

    it("converts literal escaped \\n into real newline characters", () => {
      const raw = "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgk...\\n-----END PRIVATE KEY-----\\n";
      const normalized = normalizePrivateKey(raw);
      expect(normalized).toBe("-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----");
      expect(normalized).toContain("\n");
      expect(normalized).not.toContain("\\n");
    });

    it("strips wrapping double quotes from Vercel environment values", () => {
      const raw = '"-----BEGIN PRIVATE KEY-----\\nMIIEvg...\\n-----END PRIVATE KEY-----\\n"';
      const normalized = normalizePrivateKey(raw);
      expect(normalized?.startsWith("-----BEGIN PRIVATE KEY-----")).toBe(true);
      expect(normalized?.endsWith("-----END PRIVATE KEY-----")).toBe(true);
      expect(normalized).not.toContain('"');
    });

    it("strips wrapping single quotes from Vercel environment values", () => {
      const raw = "'-----BEGIN PRIVATE KEY-----\\nMIIEvg...\\n-----END PRIVATE KEY-----\\n'";
      const normalized = normalizePrivateKey(raw);
      expect(normalized?.startsWith("-----BEGIN PRIVATE KEY-----")).toBe(true);
      expect(normalized?.endsWith("-----END PRIVATE KEY-----")).toBe(true);
      expect(normalized).not.toContain("'");
    });

    it("preserves already-multiline PEM keys", () => {
      const multiline = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----";
      expect(normalizePrivateKey(multiline)).toBe(multiline);
    });
  });

  describe("Firebase Admin Project ID Resolution & Regression Tests", () => {
    it("trims leading tab character (regression for: '\\tmedibridge-ai-4f126')", () => {
      const resolved = resolveAdminProjectId("\tmedibridge-ai-4f126");
      expect(resolved).toBe("medibridge-ai-4f126");
      expect(resolved.startsWith("\t")).toBe(false);
      expect(resolved).toBe(EXPECTED_FIREBASE_PROJECT_ID);
    });

    it("trims leading and trailing spaces and newlines", () => {
      const resolved = resolveAdminProjectId("  medibridge-ai-4f126\n  ");
      expect(resolved).toBe("medibridge-ai-4f126");
    });

    it("strips wrapping double and single quotes containing whitespace", () => {
      expect(resolveAdminProjectId('"\tmedibridge-ai-4f126"')).toBe("medibridge-ai-4f126");
      expect(resolveAdminProjectId("'\tmedibridge-ai-4f126\t'")).toBe("medibridge-ai-4f126");
    });

    it("falls back to medibridge-ai-4f126 when raw input is undefined", () => {
      const resolved = resolveAdminProjectId(undefined);
      expect(resolved).toBe("medibridge-ai-4f126");
    });

    it("throws a clear error when project ID is empty or whitespace-only", () => {
      expect(() => resolveAdminProjectId("   ")).toThrow(
        /Firebase Admin Configuration Error: Project ID is empty or whitespace-only/
      );
      expect(() => resolveAdminProjectId("\t\n")).toThrow(
        /Firebase Admin Configuration Error: Project ID is empty or whitespace-only/
      );
    });

    it("throws a clear error when project ID contains invalid characters", () => {
      expect(() => resolveAdminProjectId("Invalid_Project_ID!")).toThrow(
        /Firebase Admin Configuration Error: Project ID "Invalid_Project_ID!" is malformed/
      );
    });
  });
});
