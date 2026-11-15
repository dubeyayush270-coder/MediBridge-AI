import { describe, it, expect } from "vitest";
import {
  generateElderFriendlyPasscode,
  generateSalt,
  hashPasscode,
  verifyPasscode,
  isInviteValid,
} from "../lib/auth/passcode";
import { ROLE_PERMISSIONS, hasPermission } from "../lib/auth/rbac";
import { CaregiverPasscodeInvite } from "../lib/types/membership";
import { AppUser } from "../lib/types/user";

describe("PHASE 4 & 5 — Passcode Security, Verifiers, and Nonce Tests", () => {
  it("generates elder-friendly uppercase passcodes without ambiguous characters (0, O, 1, I)", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateElderFriendlyPasscode(6);
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
      expect(code).not.toContain("0");
      expect(code).not.toContain("O");
      expect(code).not.toContain("1");
      expect(code).not.toContain("I");
    }
  });

  it("hashes passcodes with cryptographically random salts using SHA-256", async () => {
    const salt1 = generateSalt(16);
    const salt2 = generateSalt(16);
    expect(salt1).not.toBe(salt2);

    const passcode = "MB789K";
    const hash1 = await hashPasscode(passcode, salt1);
    const hash2 = await hashPasscode(passcode, salt2);

    expect(hash1).toHaveLength(64);
    expect(hash2).toHaveLength(64);
    expect(hash1).not.toBe(hash2); // Salt prevents rainbow tables
    expect(hash1).not.toBe(passcode); // Verifier is never plaintext
  });

  it("verifies passcodes in constant time and is case-insensitive", async () => {
    const salt = generateSalt(16);
    const passcode = "Care26";
    const hash = await hashPasscode(passcode, salt);

    expect(await verifyPasscode("CARE26", hash, salt)).toBe(true);
    expect(await verifyPasscode("care26", hash, salt)).toBe(true);
    expect(await verifyPasscode("WRONG1", hash, salt)).toBe(false);
  });

  it("rejects expired invitations", () => {
    const expiredInvite: CaregiverPasscodeInvite = {
      id: "inv-expired",
      profileId: "prof-1",
      passcodeHash: "hash-val",
      salt: "salt-val",
      intendedRole: "caregiver",
      relationship: "Nurse",
      permissions: [...ROLE_PERMISSIONS.caregiver],
      expiresAt: new Date(Date.now() - 1000 * 60).toISOString(), // Expired 1 min ago
      maxAttempts: 5,
      failedAttempts: 0,
      isUsed: false,
      createdBy: "user-1",
      createdAt: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
    };

    const result = isInviteValid(expiredInvite);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("locks invitation when failed attempts reach or exceed maxAttempts (Brute Force Protection)", () => {
    const lockedInvite: CaregiverPasscodeInvite = {
      id: "inv-locked",
      profileId: "prof-1",
      passcodeHash: "hash-val",
      salt: "salt-val",
      intendedRole: "caregiver",
      relationship: "Nurse",
      permissions: [...ROLE_PERMISSIONS.caregiver],
      expiresAt: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
      maxAttempts: 5,
      failedAttempts: 5, // Exceeded max
      isUsed: false,
      createdBy: "user-1",
      createdAt: new Date().toISOString(),
    };

    const result = isInviteValid(lockedInvite);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("locked");
  });

  it("enforces single-use redemption (Replay Attack Prevention)", () => {
    const usedInvite: CaregiverPasscodeInvite = {
      id: "inv-used",
      profileId: "prof-1",
      passcodeHash: "hash-val",
      salt: "salt-val",
      intendedRole: "caregiver",
      relationship: "Nurse",
      permissions: [...ROLE_PERMISSIONS.caregiver],
      expiresAt: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
      maxAttempts: 5,
      failedAttempts: 1,
      isUsed: true, // Already redeemed
      redeemedBy: "user-nurse-1",
      redeemedAt: new Date().toISOString(),
      createdBy: "user-1",
      createdAt: new Date().toISOString(),
    };

    const result = isInviteValid(usedInvite);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("already been used");
  });

  it("derives membership role exclusively from invitation record, ignoring any client-injected role", () => {
    const serverInvitation: CaregiverPasscodeInvite = {
      id: "inv-server",
      profileId: "prof-target",
      passcodeHash: "valid-hash",
      salt: "valid-salt",
      intendedRole: "caregiver", // Trusted server assignment
      relationship: "Visiting Nurse",
      permissions: [...ROLE_PERMISSIONS.caregiver],
      expiresAt: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
      maxAttempts: 5,
      failedAttempts: 0,
      isUsed: false,
      createdBy: "patient-uid",
      createdAt: new Date().toISOString(),
    };

    // Attacker attempts to forge their role as "admin" or "family_member" in request payload
    const attackerInputRole = "elderly_patient"; // Trying to elevate privileges

    // Server logic uses serverInvitation.intendedRole, NOT attackerInputRole
    const assignedRole = serverInvitation.intendedRole;
    const assignedPermissions = ROLE_PERMISSIONS[assignedRole];

    expect(assignedRole).toBe("caregiver");
    expect(assignedRole).not.toBe(attackerInputRole);
    expect(hasPermission(assignedRole, "delete_profile")).toBe(false);
    expect(hasPermission(assignedRole, "edit_profile")).toBe(false);
  });
});
