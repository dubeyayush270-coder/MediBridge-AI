"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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
  updateProfile as updateFirebaseProfile,
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
  apiGetMe,
  apiInitUser,
  apiUpdateMe,
  apiGetProfiles,
  apiGetProfileBundle,
  apiCreateProfile,
  apiJoinProfile,
  apiLogAdherenceDose,
  apiSaveMedication,
  apiUpdateMedication,
  apiDeleteMedication,
  apiSaveAppointment,
  apiUpdateAppointment,
  apiDeleteAppointment,
  ApiError,
} from "../api/api-client";
import { getLocalDateString } from "../utils/adherence";

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
  backendConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  createProfile: (data: Partial<CareProfile>) => Promise<CareProfile>;
  joinProfileWithPasscode: (profileId: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  logMedicationDose: (
    slotOrLogId: string,
    status: "taken" | "skipped" | "missed",
    details?: {
      medicationId?: string;
      medicationName?: string;
      dosage?: string;
      scheduledTime?: string;
      scheduledDate?: string;
      notes?: string;
    }
  ) => Promise<void>;
  addMedication: (data: Partial<Medication>) => Promise<Medication>;
  updateMedication: (id: string, data: Partial<Medication>) => Promise<Medication>;
  deleteMedication: (id: string) => Promise<void>;
  addAppointment: (data: Partial<Appointment>) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
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
  const [backendConfigured, setBackendConfigured] = useState<boolean>(true);

  const isSigningUpRef = useRef<boolean>(false);
  const isFirebaseReady = isFirebaseConfigured() && firebaseAuth !== null;

  // Load profile data (medications, appointments, adherence) via protected server API
  const loadActiveProfileData = useCallback(async (profileId: string, token: string) => {
    try {
      const bundle = await apiGetProfileBundle(token, profileId);
      setActiveProfile(bundle.profile);
      setMedications(bundle.medications);
      setAppointments(bundle.appointments);
      setAdherenceLogs(bundle.adherenceLogs);
    } catch (err) {
      console.warn("[Auth] Failed to load profile bundle from server API:", err);
    }
  }, []);

  // Refresh real user profile and memberships from protected server APIs
  const loadRealUserData = useCallback(
    async (fbUser: FirebaseUser) => {
      try {
        const token = await fbUser.getIdToken();

        // 1. Fetch or initialize user record on protected server API (Self-healing for existing accounts)
        const userRes = await apiGetMe(token);
        setUser(userRes.user);
        setBackendConfigured(true);

        // 2. Fetch care profiles and memberships from protected server API
        const profRes = await apiGetProfiles(token);
        setAllProfiles(profRes.profiles);
        setMemberships(profRes.memberships);

        if (profRes.profiles.length > 0) {
          const preferred =
            profRes.profiles.find((p) => p.id === userRes.user.activeProfileId) || profRes.profiles[0];
          await loadActiveProfileData(preferred.id, token);
        } else {
          setActiveProfile(null);
          setMedications([]);
          setAppointments([]);
          setAdherenceLogs([]);
        }
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 503) {
          console.warn("[Auth] Backend Firebase Admin SDK is unconfigured on the server:", err.message);
          setBackendConfigured(false);
          // Set active fallback user from Firebase Auth identity so UI remains operational
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            role: "elderly_patient",
            accessibleProfileIds: [],
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          });
        } else {
          console.error("[Auth] Error communicating with protected server APIs:", err);
        }
      }
    },
    [loadActiveProfileData]
  );

  useEffect(() => {
    if (isFirebaseReady && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        // Prevent race condition if signUp is actively running
        if (isSigningUpRef.current) {
          return;
        }

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
        const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), pass);
        setFirebaseUser(cred.user);
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
        isSigningUpRef.current = true;
        const userCred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), pass);
        setFirebaseUser(userCred.user);

        // Update profile in Firebase Auth with full legal/preferred name
        await updateFirebaseProfile(userCred.user, { displayName: name.trim() }).catch(() => {});

        // Mint fresh ID token
        const token = await userCred.user.getIdToken(true);

        try {
          // Initialize user record on protected backend with user's selected role and display name
          const initRes = await apiInitUser(token, { displayName: name.trim(), role });
          setUser(initRes.user);
          setBackendConfigured(true);
        } catch (apiErr: unknown) {
          if (apiErr instanceof ApiError && apiErr.status === 503) {
            console.warn("[Auth] Backend Admin SDK unconfigured during registration:", apiErr.message);
            setBackendConfigured(false);
            setUser({
              uid: userCred.user.uid,
              email: userCred.user.email || email.trim(),
              displayName: name.trim(),
              role,
              accessibleProfileIds: [],
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            });
          } else {
            throw apiErr;
          }
        }

        setIsDemoMode(false);
        setActiveProfile(null);
        setAllProfiles([]);
        setMemberships([]);
        return { success: true };
      } catch (err: unknown) {
        let message = "Account registration failed";
        if (err instanceof Error) {
          if (err.message.includes("auth/email-already-in-use")) {
            message = "An account with this email already exists. Please sign in instead.";
          } else if (err.message.includes("auth/weak-password")) {
            message = "Password must be at least 6 characters.";
          } else if (err.message.includes("auth/invalid-email")) {
            message = "Please provide a valid email address.";
          } else {
            message = err.message;
          }
        }
        return { success: false, error: message };
      } finally {
        isSigningUpRef.current = false;
      }
    } else {
      if (!email.includes("@")) return { success: false, error: "Valid email required." };
      if (pass.length < 6) return { success: false, error: "Password must be at least 6 characters." };

      const newDemoUser: AppUser = {
        uid: `demo-${Date.now()}`,
        email: email.trim(),
        displayName: name.trim() || "New User",
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
    if (!found) return;

    setActiveProfile(found);

    if (!isDemoMode && firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        await apiUpdateMe(token, { activeProfileId: profileId });
        await loadActiveProfileData(profileId, token);
      } catch (err) {
        console.warn("[Auth] Failed to switch profile on server:", err);
      }
    }
  };

  const createProfile = async (data: Partial<CareProfile>): Promise<CareProfile> => {
    if (!isDemoMode && isFirebaseReady && firebaseUser) {
      // Protected server API creation
      const token = await firebaseUser.getIdToken();
      const res = await apiCreateProfile(token, data);

      setAllProfiles((prev) => [...prev, res.profile]);
      setMemberships((prev) => [...prev, res.membership]);
      setActiveProfile(res.profile);

      if (user) {
        setUser({
          ...user,
          activeProfileId: res.profile.id,
          accessibleProfileIds: [...(user.accessibleProfileIds || []), res.profile.id],
        });
      }

      await loadActiveProfileData(res.profile.id, token);
      return res.profile;
    } else {
      // In-memory demo creation
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
    if (!isDemoMode && isFirebaseReady && firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await apiJoinProfile(token, profileId, passcode);

        if (res.success && res.profile && res.membership) {
          setAllProfiles((prev) => {
            if (prev.some((p) => p.id === res.profile!.id)) return prev;
            return [...prev, res.profile!];
          });
          setMemberships((prev) => {
            if (prev.some((m) => m.id === res.membership!.id)) return prev;
            return [...prev, res.membership!];
          });
          setActiveProfile(res.profile);
          await loadActiveProfileData(res.profile.id, token);
          return { success: true };
        }
        return { success: false, error: res.error || "Failed to link care profile." };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error while joining profile." };
      }
    } else {
      // Demo in-memory join
      const target = allProfiles.find((p) => p.id === profileId);
      if (!target && profileId !== DEMO_PROFILE.id) {
        return { success: false, error: "Care profile not found. Please verify the profile ID." };
      }

      const activeTarget = target || DEMO_PROFILE;

      // Eleanor demo passcode check
      if (passcode.trim().toUpperCase() !== "CARE26") {
        return { success: false, error: "Incorrect passcode. Please try again." };
      }

      if (user) {
        const newMembership: CareProfileMembership = {
          id: `mem-${Date.now()}`,
          profileId: activeTarget.id,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
          role: user.role === "family_member" ? "family_member" : "caregiver",
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
        setActiveProfile(activeTarget);
      }
      return { success: true };
    }
  };

  const logMedicationDose = async (
    slotOrLogId: string,
    status: "taken" | "skipped" | "missed",
    details?: {
      medicationId?: string;
      medicationName?: string;
      dosage?: string;
      scheduledTime?: string;
      scheduledDate?: string;
      notes?: string;
    }
  ) => {
    const today = getLocalDateString();
    const scheduledDate = details?.scheduledDate || today;
    const scheduledTime = details?.scheduledTime || "08:00";
    const medId = details?.medicationId || slotOrLogId;
    const matchedMed = medications.find((m) => m.id === medId);
    const medName = details?.medicationName || matchedMed?.name || "Medication";
    const dosage = details?.dosage || matchedMed?.dosage || "1 dose";
    const nowIso = new Date().toISOString();

    const loggedByInfo = user
      ? {
          userId: user.uid,
          userName: user.displayName,
          role: user.role,
        }
      : undefined;

    // Optimistic UI update
    setAdherenceLogs((prev) => {
      const existingIndex = prev.findIndex(
        (l) =>
          l.id === slotOrLogId ||
          (l.medicationId === medId &&
            l.scheduledDate === scheduledDate &&
            l.scheduledTime === scheduledTime)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status,
          loggedAt: nowIso,
          loggedBy: loggedByInfo,
          notes: details?.notes !== undefined ? details.notes : updated[existingIndex].notes,
        };
        return updated;
      }

      const newLog: MedicationAdherenceLog = {
        id: slotOrLogId.startsWith("adh_")
          ? slotOrLogId
          : `adh_${activeProfile?.id || "demo"}_${medId}_${scheduledDate}_${scheduledTime.replace(/:/g, "")}`,
        profileId: activeProfile?.id || "demo-profile-eleanor",
        medicationId: medId,
        medicationName: medName,
        dosage,
        scheduledTime,
        scheduledDate,
        status,
        loggedAt: nowIso,
        loggedBy: loggedByInfo,
        notes: details?.notes,
      };
      return [...prev, newLog];
    });

    // If real Firebase user, persist to protected server API
    if (!isDemoMode && isFirebaseReady && firebaseUser && activeProfile) {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await apiLogAdherenceDose(token, activeProfile.id, {
          id: slotOrLogId,
          medicationId: medId,
          medicationName: medName,
          dosage,
          scheduledTime,
          scheduledDate,
          status,
          notes: details?.notes,
        });

        if (res.success && res.log) {
          setAdherenceLogs((prev) => {
            const idx = prev.findIndex((l) => l.id === res.log.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = res.log;
              return copy;
            }
            return [...prev, res.log];
          });
        }
      } catch (err) {
        console.error("[Auth] Failed to persist adherence dose to server API:", err);
      }
    }
  };

  const addMedication = async (data: Partial<Medication>): Promise<Medication> => {
    if (!isDemoMode && isFirebaseReady && firebaseUser && activeProfile) {
      const token = await firebaseUser.getIdToken();
      const res = await apiSaveMedication(token, activeProfile.id, data);
      setMedications((prev) => {
        const idx = prev.findIndex((m) => m.id === res.medication.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = res.medication;
          return copy;
        }
        return [...prev, res.medication];
      });
      return res.medication;
    } else {
      const newMed: Medication = {
        id: data.id || `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        profileId: activeProfile?.id || DEMO_PROFILE.id,
        name: data.name || "New Medication",
        genericName: data.genericName,
        dosage: data.dosage || "1 dose",
        route: data.route || "oral",
        frequency: data.frequency || "daily",
        scheduleTimes: data.scheduleTimes || [{ time: "08:00", label: "morning" }],
        withFood: Boolean(data.withFood),
        specialInstructions: data.specialInstructions,
        prescribingDoctor: data.prescribingDoctor,
        prescribedFor: data.prescribedFor,
        status: data.status || "active",
        refillReminder: data.refillReminder || { enabled: false },
        pillVisual: data.pillVisual,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMedications((prev) => [...prev, newMed]);
      return newMed;
    }
  };

  const updateMedication = async (id: string, data: Partial<Medication>): Promise<Medication> => {
    if (!isDemoMode && isFirebaseReady && firebaseUser && activeProfile) {
      const token = await firebaseUser.getIdToken();
      const res = await apiUpdateMedication(token, activeProfile.id, id, data);
      setMedications((prev) => prev.map((m) => (m.id === id ? res.medication : m)));
      return res.medication;
    } else {
      let updated: Medication | undefined;
      setMedications((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            updated = { ...m, ...data, updatedAt: new Date().toISOString() };
            return updated;
          }
          return m;
        })
      );
      return updated || (data as Medication);
    }
  };

  const deleteMedication = async (id: string): Promise<void> => {
    if (!isDemoMode && isFirebaseReady && firebaseUser && activeProfile) {
      const token = await firebaseUser.getIdToken();
      await apiDeleteMedication(token, activeProfile.id, id);
    }
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const addAppointment = async (data: Partial<Appointment>): Promise<Appointment> => {
    if (!isDemoMode && isFirebaseReady && firebaseUser && activeProfile) {
      const token = await firebaseUser.getIdToken();
      const res = await apiSaveAppointment(token, activeProfile.id, data);
      setAppointments((prev) => {
        const idx = prev.findIndex((a) => a.id === res.appointment.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = res.appointment;
          return copy;
        }
        return [...prev, res.appointment];
      });
      return res.appointment;
    } else {
      const newApt: Appointment = {
        id: data.id || `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        profileId: activeProfile?.id || DEMO_PROFILE.id,
        title: data.title || "Doctor Consultation",
        doctorName: data.doctorName || "Physician",
        specialty: data.specialty || "General Practice",
        clinicName: data.clinicName || "Medical Clinic",
        address: data.address || "",
        phone: data.phone || "",
        dateTime: data.dateTime || new Date().toISOString(),
        durationMinutes: data.durationMinutes || 30,
        status: data.status || "upcoming",
        purpose: data.purpose || "Consultation",
        questionsToAsk: data.questionsToAsk || [],
        preparationNotes: data.preparationNotes,
        transportAssistanceNeeded: Boolean(data.transportAssistanceNeeded),
        assignedCompanion: data.assignedCompanion,
        reminderSent: Boolean(data.reminderSent),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAppointments((prev) => [...prev, newApt]);
      return newApt;
    }
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
    if (!isDemoMode && isFirebaseReady && firebaseUser && activeProfile) {
      const token = await firebaseUser.getIdToken();
      const res = await apiUpdateAppointment(token, activeProfile.id, id, data);
      setAppointments((prev) => prev.map((a) => (a.id === id ? res.appointment : a)));
      return res.appointment;
    } else {
      let updated: Appointment | undefined;
      setAppointments((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            updated = { ...a, ...data, updatedAt: new Date().toISOString() };
            return updated;
          }
          return a;
        })
      );
      return updated || (data as Appointment);
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    if (!isDemoMode && isFirebaseReady && firebaseUser && activeProfile) {
      const token = await firebaseUser.getIdToken();
      await apiDeleteAppointment(token, activeProfile.id, id);
    }
    setAppointments((prev) => prev.filter((a) => a.id !== id));
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
        backendConfigured,
        signIn,
        signUp,
        signOut,
        switchProfile,
        createProfile,
        joinProfileWithPasscode,
        logMedicationDose,
        addMedication,
        updateMedication,
        deleteMedication,
        addAppointment,
        updateAppointment,
        deleteAppointment,
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
