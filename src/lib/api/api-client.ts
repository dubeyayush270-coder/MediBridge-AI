import { AppUser, UserRole } from "../types/user";
import { CareProfile } from "../types/care-profile";
import { CareProfileMembership } from "../types/membership";
import { Medication, MedicationAdherenceLog } from "../types/medication";
import { Appointment } from "../types/appointment";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || `HTTP error ${res.status}`, res.status, data.code);
  }

  return data as T;
}

export async function apiGetMe(token: string): Promise<{ user: AppUser }> {
  return request<{ user: AppUser }>("/api/users/me", token);
}

export async function apiInitUser(
  token: string,
  profile: { displayName?: string; role?: UserRole }
): Promise<{ user: AppUser }> {
  return request<{ user: AppUser }>("/api/users/me", token, {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function apiUpdateMe(
  token: string,
  updates: Partial<AppUser>
): Promise<{ user: AppUser }> {
  return request<{ user: AppUser }>("/api/users/me", token, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function apiGetProfiles(token: string): Promise<{
  profiles: CareProfile[];
  memberships: CareProfileMembership[];
}> {
  return request<{
    profiles: CareProfile[];
    memberships: CareProfileMembership[];
  }>("/api/profiles", token);
}

export async function apiCreateProfile(
  token: string,
  data: Partial<CareProfile>
): Promise<{
  profile: CareProfile;
  membership: CareProfileMembership;
  initialInvitationCode?: string;
}> {
  return request<{
    profile: CareProfile;
    membership: CareProfileMembership;
    initialInvitationCode?: string;
  }>("/api/profiles", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiGetProfileBundle(
  token: string,
  profileId: string
): Promise<{
  profile: CareProfile;
  membership: CareProfileMembership;
  medications: Medication[];
  appointments: Appointment[];
  adherenceLogs: MedicationAdherenceLog[];
  members: CareProfileMembership[];
}> {
  return request<{
    profile: CareProfile;
    membership: CareProfileMembership;
    medications: Medication[];
    appointments: Appointment[];
    adherenceLogs: MedicationAdherenceLog[];
    members: CareProfileMembership[];
  }>(`/api/profiles/${encodeURIComponent(profileId)}/bundle`, token);
}

export async function apiJoinProfile(
  token: string,
  profileId: string,
  passcode: string
): Promise<{
  success: boolean;
  profile?: CareProfile;
  membership?: CareProfileMembership;
  error?: string;
}> {
  return request<{
    success: boolean;
    profile?: CareProfile;
    membership?: CareProfileMembership;
    error?: string;
  }>("/api/profiles/join", token, {
    method: "POST",
    body: JSON.stringify({ profileId, passcode }),
  });
}

export async function apiCreateInvitation(
  token: string,
  profileId: string,
  options?: {
    intendedRole?: string;
    relationship?: string;
    expiresInHours?: number;
    customCode?: string;
  }
): Promise<{
  success: boolean;
  code: string;
  expiresAt: string;
  intendedRole: string;
}> {
  return request<{
    success: boolean;
    code: string;
    expiresAt: string;
    intendedRole: string;
  }>(`/api/profiles/${encodeURIComponent(profileId)}/invitations`, token, {
    method: "POST",
    body: JSON.stringify(options || {}),
  });
}

export async function apiLogAdherenceDose(
  token: string,
  profileId: string,
  logData: {
    id?: string;
    medicationId: string;
    medicationName: string;
    dosage: string;
    scheduledTime: string;
    scheduledDate: string;
    status: "taken" | "skipped";
    notes?: string;
  }
): Promise<{ success: boolean; log: MedicationAdherenceLog }> {
  return request<{ success: boolean; log: MedicationAdherenceLog }>(
    `/api/profiles/${encodeURIComponent(profileId)}/adherence`,
    token,
    {
      method: "POST",
      body: JSON.stringify(logData),
    }
  );
}
