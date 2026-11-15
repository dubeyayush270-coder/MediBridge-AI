"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AppUser, UserRole } from "../types/user";
import { CareProfile } from "../types/care-profile";
import { CareProfileMembership } from "../types/membership";
import { Medication, MedicationAdherenceLog } from "../types/medication";
import { Appointment } from "../types/appointment";
import { isFirebaseConfigured } from "./config";
import { auth as firebaseAuth } from "./client";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  DEMO_USER,
  DEMO_PROFILE,
  DEMO_MEMBERSHIPS,
  DEMO_MEDICATIONS,
  DEMO_ADHERENCE_LOGS,
  DEMO_APPOINTMENTS,
} from "./demo-data";
import {
  getOrCreateUserDoc,
  fetchCareProfilesForUser,
  createCareProfileInFirestore,
  joinProfileWithPasscodeInFirestore,
  fetchProfileMedications,
  fetchProfileAppointments,
  fetchProfileAdherenceLogs,
  logAdherenceDoseInFirestore,
  updateUserActiveProfile,
} from "./firestore";
import { hashPasscode, generateSalt, verifyPasscode } from "../auth/passcode";

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  activeProfile: CareProfile | null;
  allProfiles: CareProfile[];
  memberships: CareProfileMembership[];
  medications: Medication[];
  adherenceLogs: MedicationAdherenceLog[];
  appointments: Appointment[];
  loading: boolean;
  isDemoMode: boolean;
  isFirebaseReady: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  createProfile: (data: Partial<CareProfile>) => Promise<CareProfile>;
  joinProfileWithPasscode: (profileId: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  logMedicationDose: (logId: string, status: "taken" | "skipped") => Promise<void>;
  enterDemoMode: (role?: UserRole) => void;
  getIdToken: () => Promise<string | null>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [activeProfile, setActiveProfile] = useState<CareProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<CareProfile[]>([]);
  const [memberships, setMemberships] = useState<CareProfileMembership[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<MedicationAdherenceLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const isFirebaseReady = isFirebaseConfigured() && firebaseAuth !== null;

  // Load profile data (medications, appointments, adherence) for the active profile
  const loadActiveProfileData = useCallback(async (profileId: string) => {
    try {
      const [meds, apts, logs] = await Promise.all([
        fetchProfileMedications(profileId),
        fetchProfileAppointments(profileId),
        fetchProfileAdherenceLogs(profileId),
      ]);
      setMedications(meds);
      setAppointments(apts);
      setAdherenceLogs(logs);
    } catch (err) {
      console.warn("Could not load full profile data from Firestore:", err);
    }
  }, []);

  // Refresh real user profile and memberships from Firestore
  const loadRealUserData = useCallback(async (fbUser: FirebaseUser) => {
    try {
      // 1. Fetch or create user record in Firestore
      const appUser = await getOrCreateUserDoc({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
      });
      setUser(appUser);

      // 2. Fetch real memberships and care profiles
      const { profiles, memberships: userMemberships } = await fetchCareProfilesForUser(fbUser.uid);
      setAllProfiles(profiles);
      setMemberships(userMemberships);

      if (profiles.length > 0) {
        // Choose previously active profile or first available
        const current = profiles.find((p) => p.id === appUser.activeProfileId) || profiles[0];
        setActiveProfile(current);
        await loadActiveProfileData(current.id);
      } else {
        setActiveProfile(null);
        setMedications([]);
        setAppointments([]);
        setAdherenceLogs([]);
      }
    } catch (err) {
      console.error("Error loading real Firestore data:", err);
    }
  }, [loadActiveProfileData]);

  useEffect(() => {
    if (isFirebaseReady && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          setIsDemoMode(false);
          await loadRealUserData(fbUser);
        } else {
          // Unauthenticated state
          setUser(null);
          setActiveProfile(null);
          setAllProfiles([]);
          setMemberships([]);
          setMedications([]);
          setAdherenceLogs([]);
          setAppointments([]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // If Firebase credentials not available, start in Demo Mode
      enterDemoMode("elderly_patient");
      setLoading(false);
    }
  }, [isFirebaseReady, loadRealUserData]);

  const enterDemoMode = (role: UserRole = "elderly_patient") => {
    setIsDemoMode(true);
    let demoUserData = { ...DEMO_USER, role };
    if (role === "family_member") {
      demoUserData = {
        ...DEMO_USER,
        uid: "demo-user-marcus",
        displayName: "Marcus Vance",
        email: "marcus.vance@example.org",
        role: "family_member",
      };
    } else if (role === "caregiver") {
      demoUserData = {
        ...DEMO_USER,
        uid: "demo-user-maria",
        displayName: "Nurse Maria Ramos, RN",
        email: "nurse.maria.ramos@valleyhealth.org",
        role: "caregiver",
      };
    }
    setUser(demoUserData);
    setActiveProfile(DEMO_PROFILE);
    setAllProfiles([DEMO_PROFILE]);
    setMemberships(DEMO_MEMBERSHIPS);
    setMedications(DEMO_MEDICATIONS);
    setAdherenceLogs(DEMO_ADHERENCE_LOGS);
    setAppointments(DEMO_APPOINTMENTS);
  };

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseReady && firebaseAuth) {
      try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, pass);
        setIsDemoMode(false);
        await loadRealUserData(cred.user);
        return { success: true };
      } catch (err: unknown) {
        let message = "Authentication failed";
        if (err instanceof Error) {
          if (
            err.message.includes("auth/invalid-credential") ||
            err.message.includes("auth/wrong-password") ||
            err.message.includes("auth/user-not-found")
          ) {
            message = "Invalid email or password. Please verify your credentials.";
          } else if (err.message.includes("auth/too-many-requests")) {
            message = "Access temporarily disabled due to multiple failed login attempts. Please try again later.";
          } else if (err.message.includes("auth/email-already-in-use")) {
            message = "An account with this email already exists. Please sign in.";
          } else {
            message = err.message;
          }
        }
        return { success: false, error: message };
      }
    } else {
      // Demo validation
      if (!email.includes("@")) return { success: false, error: "Please provide a valid email." };
      if (pass.length < 6) return { success: false, error: "Password must be at least 6 characters." };
      enterDemoMode("elderly_patient");
      return { success: true };
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseReady && firebaseAuth) {
      try {
        const userCred = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
        const appUser = await getOrCreateUserDoc(
          {
            uid: userCred.user.uid,
            email: userCred.user.email,
            displayName: name,
          },
          role
        );
        setUser(appUser);
        setIsDemoMode(false);
        setActiveProfile(null);
        setAllProfiles([]);
        setMemberships([]);
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Account registration failed";
        return { success: false, error: message };
      }
    } else {
      if (!email.includes("@")) return { success: false, error: "Valid email required." };
      if (pass.length < 6) return { success: false, error: "Password must be at least 6 characters." };

      const newDemoUser: AppUser = {
        uid: `demo-${Date.now()}`,
        email,
        displayName: name || "New User",
        role,
        accessibleProfileIds: [DEMO_PROFILE.id],
        activeProfileId: DEMO_PROFILE.id,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      setUser(newDemoUser);
      setIsDemoMode(true);
      return { success: true };
    }
  };

  const signOut = async () => {
    if (isFirebaseReady && firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }
    setUser(null);
    setFirebaseUser(null);
    setActiveProfile(null);
    setAllProfiles([]);
    setMemberships([]);
    setMedications([]);
    setAdherenceLogs([]);
    setAppointments([]);
    setIsDemoMode(false);
  };

  const switchProfile = async (profileId: string) => {
    const found = allProfiles.find((p) => p.id === profileId);
    if (found) {
      setActiveProfile(found);
      if (!isDemoMode && user) {
        await updateUserActiveProfile(user.uid, profileId);
        await loadActiveProfileData(profileId);
      }
    }
  };

  const createProfile = async (data: Partial<CareProfile>): Promise<CareProfile> => {
    if (!isDemoMode && isFirebaseReady && user) {
      // Real Firestore persistence
      const { profile, membership } = await createCareProfileInFirestore(user, data);
      setAllProfiles((prev) => [...prev, profile]);
      setMemberships((prev) => [...prev, membership]);
      setActiveProfile(profile);
      setUser({
        ...user,
        activeProfileId: profile.id,
        accessibleProfileIds: [...(user.accessibleProfileIds || []), profile.id],
      });
      return profile;
    } else {
      // In-memory demo creation
      const salt = generateSalt();
      const defaultCode = "CARE26";
      const passcodeHash = await hashPasscode(defaultCode, salt);

      const newProfile: CareProfile = {
        id: `profile-${Date.now()}`,
        patientName: data.patientName || "New Patient",
        preferredName: data.preferredName || data.patientName?.split(" ")[0] || "Patient",
        dateOfBirth: data.dateOfBirth || "1955-01-01",
        allergies: data.allergies || [],
        primaryDoctor: data.primaryDoctor || {
          name: "Dr. Primary Care, MD",
          clinic: "Community Medical Center",
          phone: "(555) 555-0199",
        },
        emergencyContacts: data.emergencyContacts || [],
        joinPasscodeHash: passcodeHash,
        joinPasscodeSalt: salt,
        passcodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: user?.uid || "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setAllProfiles((prev) => [...prev, newProfile]);
      setActiveProfile(newProfile);

      if (user) {
        setUser({
          ...user,
          activeProfileId: newProfile.id,
          accessibleProfileIds: [...user.accessibleProfileIds, newProfile.id],
        });
      }
      return newProfile;
    }
  };

  const joinProfileWithPasscode = async (
    profileId: string,
    passcode: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isDemoMode && isFirebaseReady && user) {
      // Real Firestore Join
      const result = await joinProfileWithPasscodeInFirestore(user, profileId, passcode);
      if (result.success && result.profile && result.membership) {
        setAllProfiles((prev) => {
          if (prev.some((p) => p.id === result.profile!.id)) return prev;
          return [...prev, result.profile!];
        });
        setMemberships((prev) => {
          if (prev.some((m) => m.id === result.membership!.id)) return prev;
          return [...prev, result.membership!];
        });
        setActiveProfile(result.profile);
        await loadActiveProfileData(result.profile.id);
        return { success: true };
      }
      return { success: false, error: result.error || "Failed to join profile." };
    } else {
      // Demo in-memory join
      const target = allProfiles.find((p) => p.id === profileId);
      if (!target) {
        return { success: false, error: "Care profile not found. Please verify the profile ID." };
      }

      if (!target.joinPasscodeHash || !target.joinPasscodeSalt) {
        return { success: false, error: "This profile has no active passcode invitation." };
      }

      const isValid = await verifyPasscode(passcode, target.joinPasscodeHash, target.joinPasscodeSalt);
      if (!isValid) {
        return { success: false, error: "Incorrect passcode. Please try again." };
      }

      if (user) {
        const newMembership: CareProfileMembership = {
          id: `mem-${Date.now()}`,
          profileId: target.id,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
          role: user.role,
          relationshipToPatient: user.role === "family_member" ? "Family Member" : "Caregiver",
          permissions: [
            "view_profile",
            "view_medications",
            "log_adherence",
            "view_appointments",
            "view_members",
            "view_timeline",
          ],
          status: "active",
          joinedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setMemberships((prev) => [...prev, newMembership]);
        setActiveProfile(target);
      }
      return { success: true };
    }
  };

  const logMedicationDose = async (logId: string, status: "taken" | "skipped") => {
    const existingLog = adherenceLogs.find((l) => l.id === logId);

    // Optimistic UI update
    setAdherenceLogs((prev) =>
      prev.map((log) => {
        if (log.id === logId) {
          return {
            ...log,
            status,
            loggedAt: new Date().toISOString(),
            loggedBy: user
              ? {
                  userId: user.uid,
                  userName: user.displayName,
                  role: user.role,
                }
              : undefined,
          };
        }
        return log;
      })
    );

    // If real Firebase user, persist to Firestore
    if (!isDemoMode && isFirebaseReady && user) {
      try {
        await logAdherenceDoseInFirestore(logId, status, user, existingLog);
      } catch (err) {
        console.error("Failed to log adherence in Firestore:", err);
      }
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (firebaseUser) {
      try {
        return await firebaseUser.getIdToken();
      } catch {
        return null;
      }
    }
    return null;
  };

  const refreshUserData = async () => {
    if (firebaseUser) {
      await loadRealUserData(firebaseUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        activeProfile,
        allProfiles,
        memberships,
        medications,
        adherenceLogs,
        appointments,
        loading,
        isDemoMode,
        isFirebaseReady,
        signIn,
        signUp,
        signOut,
        switchProfile,
        createProfile,
        joinProfileWithPasscode,
        logMedicationDose,
        enterDemoMode,
        getIdToken,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
