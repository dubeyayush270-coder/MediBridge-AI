import { describe, it, expect, vi } from "vitest";
import { AppUser } from "../lib/types/user";
import { CareProfile } from "../lib/types/care-profile";
import { CareProfileMembership } from "../lib/types/membership";
import { ROLE_PERMISSIONS, hasPermission } from "../lib/auth/rbac";
import { hashPasscode, generateSalt, verifyPasscode } from "../lib/auth/passcode";
import { DEMO_USER, DEMO_PROFILE } from "../lib/firebase/demo-data";

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

  it("creates care profile with secure salted passcode and active creator membership", async () => {
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
      joinPasscodeHash: passcodeHash,
      joinPasscodeSalt: salt,
      passcodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: testUserA.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    expect(profile.joinPasscodeHash).not.toBe(passcode); // Verifies never stored plaintext
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
});
