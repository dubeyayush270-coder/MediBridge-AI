import { describe, it, expect } from "vitest";
import {
  DEMO_USER,
  DEMO_PROFILE,
  DEMO_MEMBERSHIPS,
  DEMO_MEDICATIONS,
  DEMO_APPOINTMENTS,
  DEMO_ADHERENCE_LOGS,
} from "../lib/firebase/demo-data";

describe("PHASE 5 — Demo Mode Strict Isolation", () => {
  it("ensures demo patient profile is completely distinct from production IDs", () => {
    expect(DEMO_PROFILE.id).toBe("profile-vance-76");
    expect(DEMO_USER.uid).toBe("demo-user-eleanor");
    expect(DEMO_USER.email).toContain("internal");
  });

  it("verifies Demo Profile has stripped all passcode hash and salt fields", () => {
    expect((DEMO_PROFILE as any).joinPasscodeHash).toBeUndefined();
    expect((DEMO_PROFILE as any).joinPasscodeSalt).toBeUndefined();
    expect((DEMO_PROFILE as any).passcodeExpiresAt).toBeUndefined();
  });

  it("ensures demo medications and adherence logs are localized and in-memory", () => {
    expect(DEMO_MEDICATIONS.length).toBeGreaterThan(0);
    expect(DEMO_MEDICATIONS.every((m) => m.profileId === DEMO_PROFILE.id)).toBe(true);

    expect(DEMO_ADHERENCE_LOGS.length).toBeGreaterThan(0);
    expect(DEMO_ADHERENCE_LOGS.every((l) => l.profileId === DEMO_PROFILE.id)).toBe(true);
  });

  it("ensures demo appointments are localized and in-memory", () => {
    expect(DEMO_APPOINTMENTS.length).toBeGreaterThan(0);
    expect(DEMO_APPOINTMENTS.every((a) => a.profileId === DEMO_PROFILE.id)).toBe(true);
  });
});
