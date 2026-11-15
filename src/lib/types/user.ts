import { NotificationPreferences } from "./notification";

export type UserRole = "elderly_patient" | "family_member" | "caregiver";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
  activeProfileId?: string;
  accessibleProfileIds: string[];
  createdAt: string;
  lastLoginAt: string;
  preferences?: {
    fontSize: "normal" | "large" | "extra-large";
    highContrast: boolean;
    audioAssistance: boolean;
    emailAlerts: boolean;
    smsAlerts: boolean;
    notifications?: NotificationPreferences;
  };
}
