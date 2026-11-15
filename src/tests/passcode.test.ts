import { describe, it, expect } from "vitest";
import {
  generateElderFriendlyPasscode,
  generateSalt,
  hashPasscode,
  verifyPasscode,
  isInviteValid,
} from "../lib/auth/passcode";

describe("Secure Passcode Engine", () => {
  it("generates 6-character elder-friendly passcodes without confusing characters", () => {
    const code = generateElderFriendlyPasscode(6);
    expect(code).toHaveLength(6);
    // Should not contain '0', 'O', '1', 'I'
    expect(code).not.toMatch(/[0O1I]/);
  });

  it("produces deterministic SHA-256 hashes for matching passcodes and salts", async () => {
    const salt = "salt-test-123";
    const passcode = "CARE26";

    const hash1 = await hashPasscode(passcode, salt);
    const hash2 = await hashPasscode(passcode, salt);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThanOrEqual(16);
  });

  it("verifies matching passcode successfully with case-insensitivity", async () => {
    const salt = generateSalt();
    const passcode = "CARE26";
    const hash = await hashPasscode(passcode, salt);

    const matchUpper = await verifyPasscode("CARE26", hash, salt);
    const matchLower = await verifyPasscode("care26", hash, salt);
    const matchWrong = await verifyPasscode("WRONG9", hash, salt);

    expect(matchUpper).toBe(true);
    expect(matchLower).toBe(true);
    expect(matchWrong).toBe(false);
  });

  it("validates expiration time and attempt limit on invites", () => {
    const activeInvite = {
      expiresAt: new Date(Date.now() + 100000).toISOString(),
      isUsed: false,
      failedAttempts: 1,
      maxAttempts: 5,
    };
    expect(isInviteValid(activeInvite).valid).toBe(true);

    const expiredInvite = {
      expiresAt: new Date(Date.now() - 100000).toISOString(),
      isUsed: false,
      failedAttempts: 0,
      maxAttempts: 5,
    };
    expect(isInviteValid(expiredInvite).valid).toBe(false);
    expect(isInviteValid(expiredInvite).reason).toContain("expired");

    const lockedInvite = {
      expiresAt: new Date(Date.now() + 100000).toISOString(),
      isUsed: false,
      failedAttempts: 5,
      maxAttempts: 5,
    };
    expect(isInviteValid(lockedInvite).valid).toBe(false);
    expect(isInviteValid(lockedInvite).reason).toContain("locked");
  });
});
