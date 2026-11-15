import { Permission } from "../types/membership";
import { UserRole } from "../types/user";

/**
 * Standard role-to-permission mapping for MediBridge AI.
 * Enforces least-privilege access across elderly patients, family members, and caregivers.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  elderly_patient: [
    "view_profile",
    "edit_profile",
    "view_medications",
    "log_adherence",
    "view_appointments",
    "view_members",
    "invite_members",
    "view_timeline",
    "view_ai_insights",
  ],
  family_member: [
    "view_profile",
    "view_medications",
    "log_adherence",
    "view_appointments",
    "manage_appointments",
    "view_members",
    "invite_members",
    "view_timeline",
    "view_ai_insights",
  ],
  caregiver: [
    "view_profile",
    "view_medications",
    "manage_medications",
    "log_adherence",
    "view_appointments",
    "manage_appointments",
    "view_members",
    "view_timeline",
    "view_ai_insights",
  ],
} as const;

/**
 * Check if a given role has a specific permission
 */
export function hasPermission(
  role: UserRole | undefined | null,
  permission: Permission,
  customPermissions?: Permission[]
): boolean {
  if (!role) return false;

  // If explicit custom permissions are provided (e.g. from membership record), prioritize them
  if (customPermissions && customPermissions.length > 0) {
    return customPermissions.includes(permission);
  }

  const rolePerms = ROLE_PERMISSIONS[role];
  return rolePerms ? rolePerms.includes(permission) : false;
}

/**
 * Human-readable role labels for UI display
 */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "elderly_patient":
      return "Care Recipient (Patient)";
    case "family_member":
      return "Family Member";
    case "caregiver":
      return "Professional / Primary Caregiver";
    default:
      return "User";
  }
}

/**
 * Human-readable role description for registration & invitation screens
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case "elderly_patient":
      return "I am managing my own health, medications, and care team.";
    case "family_member":
      return "I am supporting an elderly parent or family member with their health.";
    case "caregiver":
      return "I am a professional caregiver, nurse, or designated daily care aide.";
    default:
      return "";
  }
}
