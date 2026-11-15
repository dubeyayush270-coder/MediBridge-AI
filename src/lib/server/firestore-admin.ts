import { getAdminDb } from "../firebase/admin";
import { AppUser, UserRole } from "../types/user";
import { CareProfile } from "../types/care-profile";
import { CareProfileMembership, CaregiverPasscodeInvite, Permission } from "../types/membership";
import { Medication, MedicationAdherenceLog } from "../types/medication";
import { Appointment } from "../types/appointment";
import { ROLE_PERMISSIONS, hasPermission } from "../auth/rbac";
import {
  generateSalt,
  hashPasscode,
  verifyPasscode,
  generateElderFriendlyPasscode,
} from "../auth/passcode";

export class AdminFirestoreError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "AdminFirestoreError";
  }
}

function getDb() {
  const db = getAdminDb();
  if (!db) {
    throw new AdminFirestoreError(
      "Firebase Admin SDK is not initialized. Please configure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY or Application Default Credentials.",
      503
    );
  }
  return db;
}

/**
 * 1. USER ACCOUNTS (PROTECTED SERVER OPERATIONS)
 */
export async function adminGetUserDoc(uid: string): Promise<AppUser | null> {
  const db = getDb();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    uid,
    email: d.email || "",
    displayName: d.displayName || "User",
    phoneNumber: d.phoneNumber,
    role: d.role || "elderly_patient",
    activeProfileId: d.activeProfileId,
    accessibleProfileIds: d.accessibleProfileIds || [],
    createdAt: d.createdAt || new Date().toISOString(),
    lastLoginAt: d.lastLoginAt || new Date().toISOString(),
    preferences: d.preferences || {
      fontSize: "large",
      highContrast: false,
      audioAssistance: false,
      emailAlerts: true,
      smsAlerts: true,
    },
  };
}

export async function adminGetOrCreateUserDoc(
  fbUser: { uid: string; email: string | null; displayName: string | null },
  defaultRole: UserRole = "elderly_patient"
): Promise<AppUser> {
  const existing = await adminGetUserDoc(fbUser.uid);
  if (existing) {
    // Update lastLoginAt
    const db = getDb();
    await db
      .collection("users")
      .doc(fbUser.uid)
      .update({
        lastLoginAt: new Date().toISOString(),
      })
      .catch(() => {});
    return existing;
  }

  const db = getDb();
  const newUser: AppUser = {
    uid: fbUser.uid,
    email: fbUser.email || "",
    displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
    role: defaultRole,
    accessibleProfileIds: [],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    preferences: {
      fontSize: "large",
      highContrast: false,
      audioAssistance: false,
      emailAlerts: true,
      smsAlerts: true,
    },
  };

  await db.collection("users").doc(fbUser.uid).set(newUser);
  return newUser;
}

export async function adminUpdateUserDoc(uid: string, updates: Partial<AppUser>): Promise<void> {
  const db = getDb();
  await db
    .collection("users")
    .doc(uid)
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
}

/**
 * 2. MEMBERSHIPS & CARE PROFILES (PROTECTED SERVER OPERATIONS)
 */
export async function adminFetchMembershipsForUser(userId: string): Promise<CareProfileMembership[]> {
  const db = getDb();
  const snap = await db.collection("memberships").where("userId", "==", userId).get();
  const list: CareProfileMembership[] = [];

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    list.push({
      id: docSnap.id,
      profileId: d.profileId,
      userId: d.userId,
      userEmail: d.userEmail || "",
      userName: d.userName || "Member",
      role: d.role,
      relationshipToPatient: d.relationshipToPatient || "Care Member",
      permissions: d.permissions || (d.role ? [...ROLE_PERMISSIONS[d.role as UserRole]] : []),
      status: d.status || "active",
      joinedAt: d.joinedAt || new Date().toISOString(),
      updatedAt: d.updatedAt || new Date().toISOString(),
    });
  });

  return list;
}

export async function adminGetCareProfile(profileId: string): Promise<CareProfile | null> {
  const db = getDb();
  const snap = await db.collection("careProfiles").doc(profileId).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    patientName: d.patientName,
    preferredName: d.preferredName || d.patientName?.split(" ")[0],
    dateOfBirth: d.dateOfBirth,
    gender: d.gender,
    bloodType: d.bloodType,
    primaryConditionNotes: d.primaryConditionNotes,
    allergies: d.allergies || [],
    primaryDoctor: d.primaryDoctor || {
      name: "Primary Care Doctor",
      clinic: "Medical Center",
      phone: "",
    },
    emergencyContacts: d.emergencyContacts || [],
    createdBy: d.createdBy,
    notificationSettings: d.notificationSettings,
    createdAt: d.createdAt || new Date().toISOString(),
    updatedAt: d.updatedAt || new Date().toISOString(),
  };
}

export async function adminFetchProfilesForUser(userId: string): Promise<{
  profiles: CareProfile[];
  memberships: CareProfileMembership[];
}> {
  const memberships = await adminFetchMembershipsForUser(userId);
  const activeMemberships = memberships.filter((m) => m.status === "active");
  const profileIds = Array.from(new Set(activeMemberships.map((m) => m.profileId)));

  const profiles: CareProfile[] = [];
  for (const pid of profileIds) {
    const prof = await adminGetCareProfile(pid);
    if (prof) {
      profiles.push(prof);
    }
  }

  return { profiles, memberships: activeMemberships };
}

export async function adminCreateCareProfile(
  creatorUser: AppUser,
  profileData: Partial<CareProfile>
): Promise<{
  profile: CareProfile;
  membership: CareProfileMembership;
  initialInvitationCode: string;
}> {
  const db = getDb();
  const profileId = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 1. Create clean CareProfile WITHOUT passcode fields
  const newProfile: CareProfile = {
    id: profileId,
    patientName: profileData.patientName || "New Patient",
    preferredName: profileData.preferredName || profileData.patientName?.split(" ")[0] || "Patient",
    dateOfBirth: profileData.dateOfBirth || "1955-01-01",
    gender: profileData.gender || "Not specified",
    bloodType: profileData.bloodType || "Unknown",
    primaryConditionNotes: profileData.primaryConditionNotes || "Routine elder care.",
    allergies: profileData.allergies || [],
    primaryDoctor: profileData.primaryDoctor || {
      name: "Dr. Primary Care, MD",
      clinic: "Community Medical Pavilion",
      phone: "(555) 555-0199",
    },
    emergencyContacts: profileData.emergencyContacts || [],
    createdBy: creatorUser.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("careProfiles").doc(profileId).set(newProfile);

  // 2. Create membership for the creator (with full owner permissions on their created profile)
  const membershipId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const creatorPermissions: Permission[] = Array.from(
    new Set<Permission>([
      ...ROLE_PERMISSIONS[creatorUser.role],
      "manage_medications",
      "manage_appointments",
      "edit_profile",
      "invite_members",
      "view_members",
    ])
  );
  const newMembership: CareProfileMembership = {
    id: membershipId,
    profileId,
    userId: creatorUser.uid,
    userEmail: creatorUser.email,
    userName: creatorUser.displayName,
    role: creatorUser.role,
    relationshipToPatient: creatorUser.role === "elderly_patient" ? "Self" : "Primary Family Coordinator",
    permissions: creatorPermissions,
    status: "active",
    joinedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("memberships").doc(membershipId).set(newMembership);

  // 3. Create initial server-side invitation in `careProfileInvitations` (PHASE 4)
  const initialPasscode = "CARE26"; // Standard hackathon demo code
  const salt = generateSalt(16);
  const passcodeHash = await hashPasscode(initialPasscode, salt);
  const inviteId = `invite-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const invitationRecord: CaregiverPasscodeInvite = {
    id: inviteId,
    profileId,
    patientName: newProfile.patientName,
    passcodeHash,
    salt,
    intendedRole: creatorUser.role === "elderly_patient" ? "caregiver" : "family_member",
    relationship: creatorUser.role === "elderly_patient" ? "Caregiver" : "Family Member",
    permissions: [...ROLE_PERMISSIONS.caregiver],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxAttempts: 5,
    failedAttempts: 0,
    isUsed: false,
    createdBy: creatorUser.uid,
    createdAt: new Date().toISOString(),
  };

  await db.collection("careProfileInvitations").doc(inviteId).set(invitationRecord);

  // 4. Update user's active & accessible profile IDs
  const updatedAccessible = Array.from(new Set([...(creatorUser.accessibleProfileIds || []), profileId]));
  await db
    .collection("users")
    .doc(creatorUser.uid)
    .update({
      activeProfileId: profileId,
      accessibleProfileIds: updatedAccessible,
      updatedAt: new Date().toISOString(),
    })
    .catch(() => {});

  return {
    profile: newProfile,
    membership: newMembership,
    initialInvitationCode: initialPasscode,
  };
}

/**
 * 3. AUTHORIZATION & RBAC VERIFICATION GUARD
 */
export async function adminVerifyProfileAccess(
  userId: string,
  profileId: string,
  requiredPermission?: Permission
): Promise<{
  authorized: boolean;
  membership?: CareProfileMembership;
  error?: string;
  statusCode?: number;
}> {
  const db = getDb();
  const snap = await db
    .collection("memberships")
    .where("userId", "==", userId)
    .where("profileId", "==", profileId)
    .get();

  if (snap.empty) {
    return {
      authorized: false,
      error: "Forbidden: You are not an authorized member of this care profile.",
      statusCode: 403,
    };
  }

  const membershipDoc = snap.docs[0];
  const d = membershipDoc.data();
  const membership: CareProfileMembership = {
    id: membershipDoc.id,
    profileId: d.profileId,
    userId: d.userId,
    userEmail: d.userEmail || "",
    userName: d.userName || "Member",
    role: d.role,
    relationshipToPatient: d.relationshipToPatient || "Care Member",
    permissions: d.permissions || (d.role ? [...ROLE_PERMISSIONS[d.role as UserRole]] : []),
    status: d.status || "active",
    joinedAt: d.joinedAt || new Date().toISOString(),
    updatedAt: d.updatedAt || new Date().toISOString(),
  };

  if (membership.status !== "active") {
    return {
      authorized: false,
      error: "Forbidden: Your profile membership is inactive or suspended.",
      statusCode: 403,
    };
  }

  if (requiredPermission) {
    const permitted = hasPermission(membership.role, requiredPermission, membership.permissions);
    if (!permitted) {
      // Check if user is the profile creator
      const profileSnap = await db.collection("careProfiles").doc(profileId).get();
      const profileCreator = profileSnap.exists ? profileSnap.data()?.createdBy : null;
      if (profileCreator === userId) {
        return { authorized: true, membership };
      }

      return {
        authorized: false,
        error: `Forbidden: Your role (${membership.role}) lacks the required permission: ${requiredPermission}.`,
        statusCode: 403,
      };
    }
  }

  return { authorized: true, membership };
}

/**
 * 4. SECURE INVITATIONS & ATOMIC TRANSACTION REDEMPTION (PHASE 4)
 */
export async function adminCreateInvitation(
  profileId: string,
  creatorUser: AppUser,
  options?: {
    intendedRole?: UserRole;
    relationship?: string;
    expiresInHours?: number;
    customCode?: string;
  }
): Promise<{
  invitationId: string;
  code: string;
  expiresAt: string;
  intendedRole: UserRole;
}> {
  const db = getDb();

  // Authorize creator: must have "invite_members" permission
  const authCheck = await adminVerifyProfileAccess(creatorUser.uid, profileId, "invite_members");
  if (!authCheck.authorized) {
    throw new AdminFirestoreError(authCheck.error || "Forbidden", authCheck.statusCode || 403);
  }

  const code = (options?.customCode || generateElderFriendlyPasscode(6)).toUpperCase();
  const salt = generateSalt(16);
  const passcodeHash = await hashPasscode(code, salt);
  const inviteId = `invite-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const hours = options?.expiresInHours || 48; // Default 48h expiration
  const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
  const intendedRole = options?.intendedRole || "caregiver";

  const invite: CaregiverPasscodeInvite = {
    id: inviteId,
    profileId,
    passcodeHash,
    salt,
    intendedRole,
    relationship: options?.relationship || (intendedRole === "family_member" ? "Family Member" : "Designated Caregiver"),
    permissions: [...ROLE_PERMISSIONS[intendedRole]],
    expiresAt,
    maxAttempts: 5,
    failedAttempts: 0,
    isUsed: false,
    createdBy: creatorUser.uid,
    createdAt: new Date().toISOString(),
  };

  await db.collection("careProfileInvitations").doc(inviteId).set(invite);

  return {
    invitationId: inviteId,
    code,
    expiresAt,
    intendedRole,
  };
}

/**
 * Atomic redemption of invitation passcode using Firestore transaction
 */
export async function adminRedeemInvitationTransaction(
  user: AppUser,
  profileId: string,
  candidatePasscode: string
): Promise<{
  success: boolean;
  profile?: CareProfile;
  membership?: CareProfileMembership;
  error?: string;
}> {
  const db = getDb();
  const trimmedProfileId = profileId.trim();
  const normalizedPasscode = candidatePasscode.trim().toUpperCase();

  try {
    // 1. Fetch care profile to confirm existence
    const profile = await adminGetCareProfile(trimmedProfileId);
    if (!profile) {
      return { success: false, error: "Care profile not found. Please verify the profile ID." };
    }

    // 2. Execute atomic transaction
    const result = await db.runTransaction(async (transaction) => {
      // Find active invitations for this profile
      const querySnap = await transaction.get(
        db
          .collection("careProfileInvitations")
          .where("profileId", "==", trimmedProfileId)
          .where("isUsed", "==", false)
      );

      if (querySnap.empty) {
        throw new Error("No active invitation code found for this care profile.");
      }

      // Check each candidate invitation
      let matchedInviteDoc: FirebaseFirestore.DocumentSnapshot | null = null;
      let matchedData: CaregiverPasscodeInvite | null = null;

      for (const docSnap of querySnap.docs) {
        const data = docSnap.data() as CaregiverPasscodeInvite;

        // Check expiration
        if (new Date().getTime() > new Date(data.expiresAt).getTime()) {
          continue; // Expired
        }

        // Check attempts limit
        if (data.failedAttempts >= data.maxAttempts) {
          continue; // Locked
        }

        const valid = await verifyPasscode(normalizedPasscode, data.passcodeHash, data.salt);
        if (valid) {
          matchedInviteDoc = docSnap;
          matchedData = data;
          break;
        } else {
          // Increment failed attempts on the active doc
          transaction.update(docSnap.ref, {
            failedAttempts: (data.failedAttempts || 0) + 1,
            lastFailedAt: new Date().toISOString(),
          });
        }
      }

      if (!matchedInviteDoc || !matchedData) {
        throw new Error("Invalid or expired passcode. Please verify and try again.");
      }

      // Check if user is already an active member
      const existingMembershipsSnap = await transaction.get(
        db
          .collection("memberships")
          .where("profileId", "==", trimmedProfileId)
          .where("userId", "==", user.uid)
      );

      let membership: CareProfileMembership;

      if (!existingMembershipsSnap.empty) {
        const existingDoc = existingMembershipsSnap.docs[0];
        const d = existingDoc.data();
        membership = {
          id: existingDoc.id,
          profileId: d.profileId,
          userId: d.userId,
          userEmail: d.userEmail,
          userName: d.userName,
          role: d.role,
          relationshipToPatient: d.relationshipToPatient,
          permissions: d.permissions,
          status: "active",
          joinedAt: d.joinedAt,
          updatedAt: new Date().toISOString(),
        };
      } else {
        const membershipId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        membership = {
          id: membershipId,
          profileId: trimmedProfileId,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
          role: matchedData.intendedRole,
          relationshipToPatient: matchedData.relationship || "Caregiver",
          permissions: [...ROLE_PERMISSIONS[matchedData.intendedRole]],
          status: "active",
          invitedBy: matchedData.createdBy,
          joinedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        transaction.set(db.collection("memberships").doc(membershipId), membership);
      }

      // Mark invitation as single-use redeemed
      transaction.update(matchedInviteDoc.ref, {
        isUsed: true,
        redeemedBy: user.uid,
        redeemedAt: new Date().toISOString(),
      });

      // Update user document
      const userRef = db.collection("users").doc(user.uid);
      transaction.update(userRef, {
        activeProfileId: trimmedProfileId,
        updatedAt: new Date().toISOString(),
      });

      return { profile, membership };
    });

    return {
      success: true,
      profile: result.profile,
      membership: result.membership,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to redeem passcode invitation.",
    };
  }
}

/**
 * 5. MEDICATIONS (PROTECTED SERVER OPERATIONS)
 */
export async function adminFetchMedications(profileId: string): Promise<Medication[]> {
  const db = getDb();
  const snap = await db.collection("medications").where("profileId", "==", profileId).get();
  const list: Medication[] = [];

  snap.forEach((dSnap) => {
    const d = dSnap.data();
    list.push({
      id: dSnap.id,
      profileId: d.profileId,
      name: d.name,
      genericName: d.genericName,
      dosage: d.dosage,
      route: d.route,
      frequency: d.frequency || "daily",
      scheduleTimes: d.scheduleTimes || [{ time: "08:00", label: "morning" }],
      withFood: Boolean(d.withFood),
      specialInstructions: d.specialInstructions,
      prescribingDoctor: d.prescribingDoctor,
      prescribedFor: d.prescribedFor,
      status: d.status || "active",
      refillReminder: d.refillReminder || { enabled: false },
      pillVisual: d.pillVisual,
      createdAt: d.createdAt || new Date().toISOString(),
      updatedAt: d.updatedAt || new Date().toISOString(),
    });
  });

  return list;
}

export async function adminSaveMedication(
  profileId: string,
  data: Partial<Medication>
): Promise<Medication> {
  const db = getDb();
  const medId = data.id || `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const med: Medication = {
    id: medId,
    profileId,
    name: data.name || "Medication",
    genericName: data.genericName,
    dosage: data.dosage || "As prescribed",
    route: data.route,
    frequency: data.frequency || "daily",
    scheduleTimes: data.scheduleTimes || [{ time: "08:00", label: "morning" }],
    withFood: Boolean(data.withFood),
    specialInstructions: data.specialInstructions,
    prescribingDoctor: data.prescribingDoctor,
    prescribedFor: data.prescribedFor,
    status: data.status || "active",
    refillReminder: data.refillReminder || { enabled: false },
    pillVisual: data.pillVisual,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("medications").doc(medId).set(med, { merge: true });
  return med;
}

export async function adminDeleteMedication(profileId: string, medicationId: string): Promise<void> {
  const db = getDb();
  await db.collection("medications").doc(medicationId).delete();
}

/**
 * 6. APPOINTMENTS (PROTECTED SERVER OPERATIONS)
 */
export async function adminFetchAppointments(profileId: string): Promise<Appointment[]> {
  const db = getDb();
  const snap = await db.collection("appointments").where("profileId", "==", profileId).get();
  const list: Appointment[] = [];

  snap.forEach((dSnap) => {
    const d = dSnap.data();
    list.push({
      id: dSnap.id,
      profileId: d.profileId,
      title: d.title,
      doctorName: d.doctorName,
      specialty: d.specialty,
      clinicName: d.clinicName,
      address: d.address,
      phone: d.phone,
      dateTime: d.dateTime,
      durationMinutes: d.durationMinutes || 30,
      status: d.status || "upcoming",
      purpose: d.purpose || "Consultation",
      questionsToAsk: d.questionsToAsk || [],
      preparationNotes: d.preparationNotes,
      transportAssistanceNeeded: Boolean(d.transportAssistanceNeeded),
      assignedCompanion: d.assignedCompanion,
      reminderSent: Boolean(d.reminderSent),
      createdAt: d.createdAt || new Date().toISOString(),
      updatedAt: d.updatedAt || new Date().toISOString(),
    });
  });

  return list;
}

export async function adminSaveAppointment(
  profileId: string,
  data: Partial<Appointment>
): Promise<Appointment> {
  const db = getDb();
  const aptId = data.id || `apt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const apt: Appointment = {
    id: aptId,
    profileId,
    title: data.title || "Doctor Consultation",
    doctorName: data.doctorName || "Physician",
    specialty: data.specialty || "General Practice",
    clinicName: data.clinicName || "Medical Center",
    address: data.address || "",
    phone: data.phone || "",
    dateTime: data.dateTime || new Date().toISOString(),
    durationMinutes: data.durationMinutes || 30,
    status: data.status || "upcoming",
    purpose: data.purpose || "Regular checkup",
    questionsToAsk: data.questionsToAsk || [],
    preparationNotes: data.preparationNotes,
    transportAssistanceNeeded: Boolean(data.transportAssistanceNeeded),
    assignedCompanion: data.assignedCompanion,
    reminderSent: Boolean(data.reminderSent),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("appointments").doc(aptId).set(apt, { merge: true });
  return apt;
}

export async function adminDeleteAppointment(profileId: string, appointmentId: string): Promise<void> {
  const db = getDb();
  await db.collection("appointments").doc(appointmentId).delete();
}

/**
 * 7. MEDICATION ADHERENCE LOGS (PROTECTED SERVER OPERATIONS)
 */
export async function adminFetchAdherenceLogs(profileId: string): Promise<MedicationAdherenceLog[]> {
  const db = getDb();
  const snap = await db.collection("adherenceLogs").where("profileId", "==", profileId).get();
  const list: MedicationAdherenceLog[] = [];

  snap.forEach((dSnap) => {
    const d = dSnap.data();
    list.push({
      id: dSnap.id,
      profileId: d.profileId,
      medicationId: d.medicationId,
      medicationName: d.medicationName,
      dosage: d.dosage,
      scheduledTime: d.scheduledTime,
      scheduledDate: d.scheduledDate,
      status: d.status,
      loggedAt: d.loggedAt,
      loggedBy: d.loggedBy,
      notes: d.notes,
    });
  });

  return list;
}

export async function adminLogAdherenceDose(
  profileId: string,
  user: AppUser,
  logData: {
    id?: string;
    medicationId: string;
    medicationName: string;
    dosage: string;
    scheduledTime: string;
    scheduledDate: string;
    status: "taken" | "skipped" | "missed" | "late";
    notes?: string;
  }
): Promise<MedicationAdherenceLog> {
  const db = getDb();
  const cleanTime = (logData.scheduledTime || "0800").replace(/[^0-9]/g, "");
  const deterministicId =
    logData.id ||
    `adh_${profileId}_${logData.medicationId}_${logData.scheduledDate}_${cleanTime}`;

  // Check if a log already exists for this exact dose slot to prevent duplicate adherence entries
  const existingSnap = await db
    .collection("adherenceLogs")
    .where("profileId", "==", profileId)
    .where("medicationId", "==", logData.medicationId)
    .where("scheduledDate", "==", logData.scheduledDate)
    .where("scheduledTime", "==", logData.scheduledTime)
    .limit(1)
    .get();

  const targetDocId = !existingSnap.empty ? existingSnap.docs[0].id : deterministicId;

  const log: MedicationAdherenceLog = {
    id: targetDocId,
    profileId,
    medicationId: logData.medicationId,
    medicationName: logData.medicationName,
    dosage: logData.dosage,
    scheduledTime: logData.scheduledTime,
    scheduledDate: logData.scheduledDate,
    status: logData.status,
    loggedAt: new Date().toISOString(),
    loggedBy: {
      userId: user.uid,
      userName: user.displayName,
      role: user.role,
    },
    notes: logData.notes,
  };

  await db.collection("adherenceLogs").doc(targetDocId).set(log, { merge: true });
  return log;
}
