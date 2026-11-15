import { describe, it, expect } from "vitest";
import { hasPermission, ROLE_PERMISSIONS, getRoleLabel } from "../lib/auth/rbac";

describe("Role-Based Access Control (RBAC)", () => {
  it("allows elderly patient to view profile and log adherence", () => {
    expect(hasPermission("elderly_patient", "view_profile")).toBe(true);
    expect(hasPermission("elderly_patient", "log_adherence")).toBe(true);
    expect(hasPermission("elderly_patient", "view_medications")).toBe(true);
  });

  it("restricts elderly patient from direct administrative medication deletion without approval", () => {
    expect(hasPermission("elderly_patient", "delete_profile")).toBe(false);
  });

  it("allows caregiver to manage medications and log adherence", () => {
    expect(hasPermission("caregiver", "manage_medications")).toBe(true);
    expect(hasPermission("caregiver", "log_adherence")).toBe(true);
  });

  it("allows family member to coordinate appointments and view adherence", () => {
    expect(hasPermission("family_member", "manage_appointments")).toBe(true);
    expect(hasPermission("family_member", "view_medications")).toBe(true);
  });

  it("handles undefined or null role safely without crashing", () => {
    expect(hasPermission(undefined, "view_profile")).toBe(false);
    expect(hasPermission(null, "view_profile")).toBe(false);
  });

  it("provides correct human-readable role labels", () => {
    expect(getRoleLabel("elderly_patient")).toBe("Care Recipient (Patient)");
    expect(getRoleLabel("family_member")).toBe("Family Member");
    expect(getRoleLabel("caregiver")).toBe("Professional / Primary Caregiver");
  });
});
