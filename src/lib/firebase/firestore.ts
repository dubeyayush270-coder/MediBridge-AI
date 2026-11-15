import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./client";
import { AppUser, UserRole } from "../types/user";
import { CareProfile } from "../types/care-profile";
import { CareProfileMembership } from "../types/membership";
import { Medication, MedicationAdherenceLog } from "../types/medication";
import { Appointment } from "../types/appointment";
import { hashPasscode, generateSalt, verifyPasscode } from "../auth/passcode";
import { ROLE_PERMISSIONS } from "../auth/rbac";

export class FirestoreError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "FirestoreError";
  }
}

/**
 * 1. USER PROFILE MANAGEMENT IN FIRESTORE
 */
export async function getOrCreateUserDoc(
  fbUser: { uid: string; email: string | null; displayName: string | null },
  defaultRole: UserRole = "elderly_patient"
): Promise<AppUser> {
  if (!db) {
    throw new FirestoreError("Firestore is not initialized.");
  }

  const userRef = doc(db, "users", fbUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    return {
      uid: fbUser.uid,
      email: data.email || fbUser.email || "",
      displayName: data.displayName || fbUser.displayName || "User",
      phoneNumber: data.phoneNumber,
      role: data.role || defaultRole,
      activeProfileId: data.activeProfileId,
      accessibleProfileIds: data.accessibleProfileIds || [],
      createdAt: data.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      preferences: data.preferences,
    };
  }

  // Create initial user document
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

  await setDoc(userRef, {
    ...newUser,
    updatedAt: serverTimestamp(),
  });

  return newUser;
}

export async function updateUserActiveProfile(uid: string, profileId: string): Promise<void> {
  if (!db) return;
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    activeProfileId: profileId,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 2. MEMBERSHIPS & CARE PROFILES IN FIRESTORE
 */
export async function fetchUserMemberships(userId: string): Promise<CareProfileMembership[]> {
  if (!db) return [];

  try {
    const membershipsRef = collection(db, "memberships");
    const q = query(membershipsRef, where("userId", "==", userId));
    const snap = await getDocs(q);

    const list: CareProfileMembership[] = [];
    snap.forEach((docSnap: any) => {
      const d = docSnap.data();
      list.push({
        id: docSnap.id,
        profileId: d.profileId,
        userId: d.userId,
        userEmail: d.userEmail || "",
        userName: d.userName || "Member",
        role: d.role,
        relationshipToPatient: d.relationshipToPatient || "Care Member",
        permissions: d.permissions || (d.role ? ROLE_PERMISSIONS[d.role as UserRole] : []),
        status: d.status || "active",
        joinedAt: d.joinedAt || new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString(),
      });
    });

    return list;
  } catch (err: any) {
    console.error("Error fetching memberships from Firestore:", err);
    throw new FirestoreError(err.message || "Failed to load memberships", err.code);
  }
}

export async function fetchCareProfilesForUser(userId: string): Promise<{
  profiles: CareProfile[];
  memberships: CareProfileMembership[];
}> {
  if (!db) return { profiles: [], memberships: [] };

  const memberships = await fetchUserMemberships(userId);
  if (memberships.length === 0) {
    return { profiles: [], memberships: [] };
  }

  const profileIds = Array.from(new Set(memberships.map((m) => m.profileId)));
  const profiles: CareProfile[] = [];

  for (const pid of profileIds) {
    try {
      const profRef = doc(db, "careProfiles", pid);
      const snap = await getDoc(profRef);
      if (snap.exists()) {
        const d = snap.data();
        profiles.push({
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
          joinPasscodeHash: d.joinPasscodeHash,
          joinPasscodeSalt: d.joinPasscodeSalt,
          passcodeExpiresAt: d.passcodeExpiresAt,
          createdBy: d.createdBy,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn(`Could not load careProfile ${pid}:`, err);
    }
  }

  return { profiles, memberships };
}

export async function createCareProfileInFirestore(
  creatorUser: AppUser,
  profileData: Partial<CareProfile>
): Promise<{ profile: CareProfile; membership: CareProfileMembership }> {
  if (!db) {
    throw new FirestoreError("Firestore is not initialized.");
  }

  const profileId = `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const salt = generateSalt();
  const defaultPasscode = "CARE26";
  const passcodeHash = await hashPasscode(defaultPasscode, salt);

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
    joinPasscodeHash: passcodeHash,
    joinPasscodeSalt: salt,
    passcodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: creatorUser.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Save care profile in Firestore
  const profileRef = doc(db, "careProfiles", profileId);
  await setDoc(profileRef, {
    ...newProfile,
    updatedAt: serverTimestamp(),
  });

  // 2. Create membership for the creator
  const membershipId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newMembership: CareProfileMembership = {
    id: membershipId,
    profileId,
    userId: creatorUser.uid,
    userEmail: creatorUser.email,
    userName: creatorUser.displayName,
    role: creatorUser.role,
    relationshipToPatient: creatorUser.role === "elderly_patient" ? "Self" : "Primary Family Coordinator",
    permissions: [...ROLE_PERMISSIONS[creatorUser.role]],
    status: "active",
    joinedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const membershipRef = doc(db, "memberships", membershipId);
  await setDoc(membershipRef, {
    ...newMembership,
    updatedAt: serverTimestamp(),
  });

  // 3. Update user's accessible profiles
  const userRef = doc(db, "users", creatorUser.uid);
  const updatedAccessible = Array.from(new Set([...(creatorUser.accessibleProfileIds || []), profileId]));
  await updateDoc(userRef, {
    activeProfileId: profileId,
    accessibleProfileIds: updatedAccessible,
    updatedAt: serverTimestamp(),
  }).catch((err) => console.warn("Could not update user accessibleProfileIds:", err));

  return { profile: newProfile, membership: newMembership };
}

export async function joinProfileWithPasscodeInFirestore(
  user: AppUser,
  profileId: string,
  passcode: string
): Promise<{ success: boolean; profile?: CareProfile; membership?: CareProfileMembership; error?: string }> {
  if (!db) {
    return { success: false, error: "Database not connected." };
  }

  try {
    const profRef = doc(db, "careProfiles", profileId);
    const snap = await getDoc(profRef);

    if (!snap.exists()) {
      return { success: false, error: "Care profile not found. Please verify the profile ID." };
    }

    const data = snap.data();
    if (!data.joinPasscodeHash || !data.joinPasscodeSalt) {
      return { success: false, error: "This profile does not have an active passcode invitation." };
    }

    if (data.passcodeExpiresAt && new Date().getTime() > new Date(data.passcodeExpiresAt).getTime()) {
      return { success: false, error: "This invitation code has expired. Request a new one." };
    }

    const isValid = await verifyPasscode(passcode, data.joinPasscodeHash, data.joinPasscodeSalt);
    if (!isValid) {
      return { success: false, error: "Incorrect passcode. Please try again." };
    }

    // Check if membership already exists
    const membershipsRef = collection(db, "memberships");
    const q = query(membershipsRef, where("profileId", "==", profileId), where("userId", "==", user.uid));
    const existingSnap = await getDocs(q);

    let membership: CareProfileMembership;
    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
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
        profileId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        role: user.role,
        relationshipToPatient: user.role === "family_member" ? "Family Member" : "Designated Caregiver",
        permissions: [...ROLE_PERMISSIONS[user.role]],
        status: "active",
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "memberships", membershipId), {
        ...membership,
        updatedAt: serverTimestamp(),
      });
    }

    // Update user active profile
    await updateUserActiveProfile(user.uid, profileId);

    const profile: CareProfile = {
      id: snap.id,
      patientName: data.patientName,
      preferredName: data.preferredName || data.patientName?.split(" ")[0],
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodType: data.bloodType,
      primaryConditionNotes: data.primaryConditionNotes,
      allergies: data.allergies || [],
      primaryDoctor: data.primaryDoctor,
      emergencyContacts: data.emergencyContacts || [],
      joinPasscodeHash: data.joinPasscodeHash,
      joinPasscodeSalt: data.joinPasscodeSalt,
      passcodeExpiresAt: data.passcodeExpiresAt,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return { success: true, profile, membership };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to join profile." };
  }
}

/**
 * 3. MEDICATIONS, APPOINTMENTS, ADHERENCE IN FIRESTORE
 */
export async function fetchProfileMedications(profileId: string): Promise<Medication[]> {
  if (!db) return [];
  try {
    const medsRef = collection(db, "medications");
    const q = query(medsRef, where("profileId", "==", profileId));
    const snap = await getDocs(q);

    const list: Medication[] = [];
    snap.forEach((dSnap: any) => {
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
  } catch (err) {
    console.warn("Could not load medications from Firestore:", err);
    return [];
  }
}

export async function fetchProfileAppointments(profileId: string): Promise<Appointment[]> {
  if (!db) return [];
  try {
    const aptsRef = collection(db, "appointments");
    const q = query(aptsRef, where("profileId", "==", profileId));
    const snap = await getDocs(q);

    const list: Appointment[] = [];
    snap.forEach((dSnap: any) => {
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
  } catch (err) {
    console.warn("Could not load appointments from Firestore:", err);
    return [];
  }
}

export async function fetchProfileAdherenceLogs(profileId: string): Promise<MedicationAdherenceLog[]> {
  if (!db) return [];
  try {
    const logsRef = collection(db, "adherenceLogs");
    const q = query(logsRef, where("profileId", "==", profileId));
    const snap = await getDocs(q);

    const list: MedicationAdherenceLog[] = [];
    snap.forEach((dSnap: any) => {
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
  } catch (err) {
    console.warn("Could not load adherence logs from Firestore:", err);
    return [];
  }
}

export async function logAdherenceDoseInFirestore(
  logId: string,
  status: "taken" | "skipped",
  user: AppUser,
  existingLog?: MedicationAdherenceLog
): Promise<void> {
  if (!db) return;

  const logRef = doc(db, "adherenceLogs", logId);
  const updatedData = {
    ...(existingLog || {}),
    id: logId,
    status,
    loggedAt: new Date().toISOString(),
    loggedBy: {
      userId: user.uid,
      userName: user.displayName,
      role: user.role,
    },
    updatedAt: serverTimestamp(),
  };

  await setDoc(logRef, updatedData, { merge: true });
}
