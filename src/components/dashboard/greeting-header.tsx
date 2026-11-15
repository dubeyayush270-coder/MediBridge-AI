"use client";

import React from "react";
import { formatElderDate } from "@/lib/utils";
import { CareProfile } from "@/lib/types/care-profile";
import { AppUser } from "@/lib/types/user";
import { Heart, UserCheck, ShieldAlert, Plus, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GreetingHeaderProps {
  user: AppUser | null;
  activeProfile: CareProfile | null;
  onOpenCreateProfile: () => void;
  onOpenJoinPasscode: () => void;
}

export function GreetingHeader({
  user,
  activeProfile,
  onOpenCreateProfile,
  onOpenJoinPasscode,
}: GreetingHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const todayFormatted = formatElderDate(new Date());

  const displayName = activeProfile
    ? activeProfile.preferredName || activeProfile.patientName
    : user?.displayName || "Friend";

  return (
    <div className="bg-gradient-to-r from-teal-800 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
      {/* Subtle decorative circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-600/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="teal" size="sm" className="bg-teal-700/80 text-teal-100 border-teal-500/50">
              {todayFormatted}
            </Badge>
            {activeProfile && (
              <span className="text-xs text-teal-200 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                Care Profile: {activeProfile.patientName} (Age: {new Date().getFullYear() - new Date(activeProfile.dateOfBirth).getFullYear()})
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            {getGreeting()},{" "}
            <span className="text-teal-300 underline decoration-teal-400/40 decoration-4 underline-offset-4">
              {displayName}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-teal-100 mt-2 max-w-2xl font-medium">
            Here is your health and daily care schedule for today. Everything is on track.
          </p>
        </div>

        {/* Action buttons: Create profile or enter shared passcode */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={onOpenJoinPasscode}
            className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-sm font-bold flex items-center gap-2 backdrop-blur-sm"
          >
            <Key className="w-4 h-4 text-teal-300" />
            <span>Join with Passcode</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onOpenCreateProfile}
            className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-sm shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Care Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
