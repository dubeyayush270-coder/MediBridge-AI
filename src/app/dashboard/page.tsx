"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { TodayMedications } from "@/components/dashboard/today-medications";
import { UpcomingAppointments } from "@/components/dashboard/upcoming-appointments";
import { AdherenceSummary } from "@/components/dashboard/adherence-summary";
import { CaregiverTeam } from "@/components/dashboard/caregiver-team";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { CreateProfileModal } from "@/components/dashboard/create-profile-modal";
import { PasscodeModal } from "@/components/dashboard/passcode-modal";
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
  } = useAuth();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);

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
                You haven't set up or linked an elderly care profile yet. Create a new care profile for yourself or your loved one, or enter a family access passcode to join an existing care circle.
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Primary Daily Healthcare Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Medications */}
          <TodayMedications
            medications={medications}
            adherenceLogs={adherenceLogs}
            onLogDose={logMedicationDose}
          />

          {/* Upcoming Appointments */}
          <UpcomingAppointments appointments={appointments} />
        </div>

        {/* Right 1 Column: Adherence, Caregivers, and Quick Actions */}
        <div className="space-y-8">
          {/* Medication Adherence Summary */}
          <AdherenceSummary logs={adherenceLogs} />

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
          />
        </div>
      </div>

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
    </div>
  );
}
