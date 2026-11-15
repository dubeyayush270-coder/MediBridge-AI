"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { CareCopilot } from "@/components/dashboard/care-copilot";
import { TodayMedications } from "@/components/dashboard/today-medications";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { AdherenceSummary } from "@/components/dashboard/adherence-summary";
import { CaregiverTeam } from "@/components/dashboard/caregiver-team";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { CreateProfileModal } from "@/components/dashboard/create-profile-modal";
import { PasscodeModal } from "@/components/dashboard/passcode-modal";
import { MedicationModal } from "@/components/dashboard/medication-modal";
import { AppointmentModal } from "@/components/dashboard/appointment-modal";
import { Medication } from "@/lib/types/medication";
import { Appointment } from "@/lib/types/appointment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Plus, Key, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const {
    user,
    activeProfile,
    allProfiles,
    memberships,
    medications,
    adherenceLogs,
    appointments,
    loading,
    isDemoMode,
    createProfile,
    joinProfileWithPasscode,
    logMedicationDose,
    addMedication,
    updateMedication,
    deleteMedication,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAuth();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);
  const [medicationModalOpen, setMedicationModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Check RBAC permissions for active profile
  const currentMembership = memberships.find(
    (m) => m.userId === user?.uid && m.profileId === activeProfile?.id
  );
  const isCreator = activeProfile?.createdBy === user?.uid;
  const canManageMedications =
    isDemoMode ||
    isCreator ||
    user?.role === "caregiver" ||
    Boolean(currentMembership?.permissions.includes("manage_medications"));
  const canManageAppointments =
    isDemoMode ||
    isCreator ||
    user?.role === "caregiver" ||
    user?.role === "family_member" ||
    Boolean(currentMembership?.permissions.includes("manage_appointments"));

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xl font-bold text-navy-800">Loading your MediBridge Care Dashboard...</p>
      </div>
    );
  }

  // Not signed in state
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-4">
        <div className="w-16 h-16 bg-navy-100 text-navy-800 rounded-3xl mx-auto flex items-center justify-center">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-navy-900">Sign In Required</h2>
        <p className="text-base text-navy-600">
          Please sign in to view and manage your protected health information.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/login">
            <Button variant="primary" size="lg">
              Sign In Now
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Personalized Greeting Header */}
      <GreetingHeader
        user={user}
        activeProfile={activeProfile}
        onOpenCreateProfile={() => setCreateModalOpen(true)}
        onOpenJoinPasscode={() => setPasscodeModalOpen(true)}
      />

      {/* New User Welcome / Empty Care Profile Banner */}
      {!activeProfile && !isDemoMode && (
        <Card className="border-2 border-teal-300 bg-teal-50/80 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>Account Ready</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-navy-900">
                Welcome to MediBridge AI, {user.displayName}!
              </h2>
              <p className="text-base text-navy-700 max-w-2xl font-medium">
                You haven&apos;t set up or linked an elderly care profile yet. Create a new care profile for yourself or your loved one, or enter a family access passcode to join an existing care circle.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setCreateModalOpen(true)}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Care Profile</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPasscodeModalOpen(true)}
                className="border-teal-700 text-teal-800 hover:bg-teal-100/60 font-bold flex items-center gap-2"
              >
                <Key className="w-5 h-5 text-teal-700" />
                <span>Join with Passcode</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* MediBridge Care Copilot Daily Briefing */}
      <CareCopilot
        medications={medications}
        adherenceLogs={adherenceLogs}
        appointments={appointments}
        patientName={activeProfile?.preferredName || activeProfile?.patientName || user?.displayName || "Patient"}
        role={user?.role}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Primary Daily Healthcare Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Medications & Prescribed Regimens (Phase 3 CRUD) */}
          <div id="today-medications-section">
            <TodayMedications
              medications={medications}
              adherenceLogs={adherenceLogs}
              onLogDose={logMedicationDose}
              onAddMedication={() => {
                setEditingMedication(null);
                setMedicationModalOpen(true);
              }}
              onEditMedication={(med) => {
                setEditingMedication(med);
                setMedicationModalOpen(true);
              }}
              onDeleteMedication={async (medId) => {
                await deleteMedication(medId);
              }}
              canManageMedications={canManageMedications}
            />
          </div>

          {/* Upcoming Appointments (Phase 4 CRUD) */}
          <div id="upcoming-appointments-section">
            <UpcomingAppointments
              appointments={appointments}
              onScheduleAppointment={() => {
                setEditingAppointment(null);
                setAppointmentModalOpen(true);
              }}
              onEditAppointment={(apt) => {
                setEditingAppointment(apt);
                setAppointmentModalOpen(true);
              }}
              onDeleteAppointment={async (aptId) => {
                await deleteAppointment(aptId);
              }}
              canManageAppointments={canManageAppointments}
            />
          </div>
        </div>

        {/* Right 1 Column: Adherence, Caregivers, and Quick Actions */}
        <div className="space-y-8">
          {/* Medication Adherence Summary */}
          <div id="adherence-summary-section">
            <AdherenceSummary logs={adherenceLogs} medications={medications} />
          </div>

          {/* Caregiver & Family Team */}
          <CaregiverTeam
            memberships={memberships}
            activeProfile={activeProfile}
            onOpenInviteModal={() => setPasscodeModalOpen(true)}
          />

          {/* Quick Actions & Emergency Contacts */}
          <QuickActions
            activeProfile={activeProfile}
            onOpenCreateProfile={() => setCreateModalOpen(true)}
            onOpenAddMedication={
              canManageMedications
                ? () => {
                    setEditingMedication(null);
                    setMedicationModalOpen(true);
                  }
                : undefined
            }
            onOpenAddAppointment={
              canManageAppointments
                ? () => {
                    setEditingAppointment(null);
                    setAppointmentModalOpen(true);
                  }
                : undefined
            }
          />
        </div>
      </div>

      {/* Notifications, Reminders & Email Alerts Panel */}
      <NotificationsPanel profileId={activeProfile?.id || ""} />

      {/* Create Care Profile Modal */}
      <CreateProfileModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateProfile={createProfile}
      />

      {/* Secure Passcode Link/Invite Modal */}
      <PasscodeModal
        isOpen={passcodeModalOpen}
        onClose={() => setPasscodeModalOpen(false)}
        activeProfile={activeProfile}
        onJoinWithPasscode={joinProfileWithPasscode}
      />

      {/* Add / Edit Medication Modal */}
      <MedicationModal
        isOpen={medicationModalOpen}
        onClose={() => {
          setMedicationModalOpen(false);
          setEditingMedication(null);
        }}
        initialData={editingMedication}
        onSave={async (data) => {
          if (editingMedication?.id) {
            await updateMedication(editingMedication.id, data);
          } else {
            await addMedication(data);
          }
        }}
      />

      {/* Schedule / Edit Consultation Modal */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => {
          setAppointmentModalOpen(false);
          setEditingAppointment(null);
        }}
        initialData={editingAppointment}
        onSave={async (data) => {
          if (editingAppointment?.id) {
            await updateAppointment(editingAppointment.id, data);
          } else {
            await addAppointment(data);
          }
        }}
      />
    </div>
  );
}
