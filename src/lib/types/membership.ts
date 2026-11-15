import { UserRole } from "./user";

export type Permission =
  | "view_profile"
  | "edit_profile"
  | "delete_profile"
  | "view_medications"
  | "manage_medications"
  | "log_adherence"
  | "view_appointments"
  | "manage_appointments"
  | "view_members"
  | "invite_members"
  | "remove_members"
  | "view_timeline"
  | "view_ai_insights";

export interface CareProfileMembership {
  id: string;
  profileId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  relationshipToPatient: string; // e.g. "Self", "Daughter", "Visiting Nurse"
  permissions: Permission[];
  status: "active" | "invited" | "suspended";
  invitedBy?: string;
  joinedAt: string;
  updatedAt: string;
}

export interface CaregiverPasscodeInvite {
  id: string;
  profileId: string;
  patientName: string;
  passcodeHash: string;
  salt: string;
  intendedRole: UserRole;
  invitedEmail?: string;
  relationship: string;
  permissions: Permission[];
  expiresAt: string;
  maxAttempts: number;
  failedAttempts: number;
  isUsed: boolean;
  createdBy: string;
  createdAt: string;
}
