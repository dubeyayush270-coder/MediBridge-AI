"use client";

import React, { useMemo } from "react";
import { Medication, MedicationAdherenceLog } from "@/lib/types/medication";
import { Appointment } from "@/lib/types/appointment";
import {
  evaluateCareCopilotBriefing,
  CopilotBriefing,
} from "@/lib/copilot/copilot-engine";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Pill,
  ShieldCheck,
  Utensils,
  UserCheck,
} from "lucide-react";

interface CareCopilotProps {
  medications: Medication[];
  adherenceLogs: MedicationAdherenceLog[];
  appointments: Appointment[];
  patientName?: string;
  role?: string;
  onNavigateSection?: (sectionId: "medications" | "appointments" | "adherence") => void;
}

export function CareCopilot({
  medications,
  adherenceLogs,
  appointments,
  patientName = "Patient",
  role,
  onNavigateSection,
}: CareCopilotProps) {
  // Pure, reactive evaluation of contextual briefing
  const briefing: CopilotBriefing = useMemo(() => {
    return evaluateCareCopilotBriefing(
      medications,
      adherenceLogs,
      appointments,
      patientName
    );
  }, [medications, adherenceLogs, appointments, patientName]);

  const handleScrollTo = (id: string, fallback: "medications" | "appointments" | "adherence") => {
    if (onNavigateSection) {
      onNavigateSection(fallback);
      return;
    }
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
      elem.focus?.();
    }
  };

  // Map to UI Badge component variants
  const getBadgeVariant = (variant: CopilotBriefing["badgeVariant"]): "danger" | "warning" | "teal" | "success" | "neutral" => {
    switch (variant) {
      case "critical":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "teal";
      case "success":
        return "success";
      case "neutral":
      default:
        return "neutral";
    }
  };

  // Background banner theme based on priority
  const getBannerBackground = (variant: CopilotBriefing["badgeVariant"]) => {
    switch (variant) {
      case "critical":
        return "bg-gradient-to-br from-rose-50 via-white to-orange-50 border-rose-200";
      case "warning":
        return "bg-gradient-to-br from-amber-50 via-white to-yellow-50 border-amber-200";
      case "info":
        return "bg-gradient-to-br from-sky-50 via-white to-indigo-50 border-sky-200";
      case "success":
        return "bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-emerald-200";
      case "neutral":
      default:
        return "bg-gradient-to-br from-slate-50 via-white to-teal-50/40 border-teal-200";
    }
  };

  const getPriorityIcon = (variant: CopilotBriefing["badgeVariant"]) => {
    switch (variant) {
      case "critical":
        return <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" aria-hidden="true" />;
      case "warning":
        return <Clock className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />;
      case "info":
        return <Calendar className="w-5 h-5 text-sky-700 shrink-0" aria-hidden="true" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />;
      case "neutral":
      default:
        return <Sparkles className="w-5 h-5 text-teal-700 shrink-0" aria-hidden="true" />;
    }
  };

  return (
    <section
      role="region"
      aria-label="MediBridge Care Copilot Daily Briefing"
      className="w-full"
    >
      <Card
        className={`border-2 shadow-sm rounded-2xl overflow-hidden transition-colors ${getBannerBackground(
          briefing.badgeVariant
        )}`}
      >
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 pb-4 border-b border-black/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-teal-200" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
                  MediBridge Care Copilot
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-900 uppercase tracking-wider">
                  Live Assistant
                </span>
              </div>
              <p className="text-xs sm:text-sm text-navy-700 font-medium">
                Personalized daily briefing for <strong className="text-navy-900">{patientName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={getBadgeVariant(briefing.badgeVariant)}
              size="md"
              className="px-3 py-1 flex items-center gap-1.5 shadow-2xs"
            >
              {getPriorityIcon(briefing.badgeVariant)}
              <span>{briefing.priorityLabel}</span>
            </Badge>
          </div>
        </div>

        {/* Core Decision & Guidance Message */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-navy-900 flex items-center gap-2">
              {briefing.headline}
            </h3>
            <p className="text-base sm:text-lg text-navy-800 font-medium leading-relaxed">
              {briefing.primaryMessage}
            </p>
            {briefing.guidanceNote && (
              <div className="p-3.5 rounded-xl bg-white/85 border border-navy-100 text-sm text-navy-800 flex items-start gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="font-medium">{briefing.guidanceNote}</span>
              </div>
            )}
          </div>

          {/* Quick Care Status Grid (Next Dose, Adherence Tally, Upcoming Appointment) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Box 1: Next Scheduled Dose */}
            <div className="p-3.5 rounded-xl bg-white border border-navy-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-navy-600 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                  Next Dose
                </span>
              </div>
              {briefing.nextDose ? (
                <div>
                  <p className="text-base font-extrabold text-navy-950 truncate">
                    {briefing.nextDose.medicationName}
                  </p>
                  <p className="text-xs text-navy-700 font-semibold">
                    {briefing.nextDose.dosage} • {briefing.nextDose.formattedTime}
                  </p>
                  {briefing.nextDose.withFood && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-medium mt-1">
                      <Utensils className="w-3 h-3" aria-hidden="true" /> With food
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm font-semibold text-navy-500 pt-1">
                  {briefing.todayStats.totalDoses > 0
                    ? "All doses taken for today!"
                    : "No doses scheduled"}
                </p>
              )}
            </div>

            {/* Box 2: Today's Adherence Tally */}
            <div className="p-3.5 rounded-xl bg-white border border-navy-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-navy-600 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                  Today&apos;s Adherence
                </span>
                <span className="text-teal-900 font-black">
                  {briefing.todayStats.takenPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${briefing.todayStats.takenPercentage}%` }}
                  aria-valuenow={briefing.todayStats.takenPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                  aria-label="Today adherence percentage"
                />
              </div>
              <p className="text-xs text-navy-700 font-semibold pt-1 flex items-center justify-between">
                <span>Taken: <strong>{briefing.todayStats.taken}/{briefing.todayStats.totalDoses}</strong></span>
                {briefing.todayStats.missed > 0 && (
                  <span className="text-rose-700 font-bold">
                    Missed: {briefing.todayStats.missed}
                  </span>
                )}
                {briefing.todayStats.skipped > 0 && (
                  <span className="text-amber-700 font-bold">
                    Skipped: {briefing.todayStats.skipped}
                  </span>
                )}
              </p>
            </div>

            {/* Box 3: Upcoming Consultation */}
            <div className="p-3.5 rounded-xl bg-white border border-navy-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-navy-600 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                  Next Consultation
                </span>
              </div>
              {briefing.upcomingAppointment ? (
                <div>
                  <p className="text-base font-extrabold text-navy-950 truncate">
                    Dr. {briefing.upcomingAppointment.doctorName}
                  </p>
                  <p className="text-xs text-navy-700 font-semibold truncate">
                    {briefing.upcomingAppointment.specialty} • {briefing.upcomingAppointment.formattedDate}
                  </p>
                  {briefing.upcomingAppointment.transportAssistanceNeeded && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-sky-800 font-medium mt-1">
                      <UserCheck className="w-3 h-3" aria-hidden="true" /> Transport needed
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm font-semibold text-navy-500 pt-1">
                  No upcoming visits this week
                </p>
              )}
            </div>
          </div>

          {/* Accessible Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScrollTo("today-medications-section", "medications")}
                className="h-11 px-4 border-navy-200 text-navy-900 hover:bg-white hover:border-teal-600 font-bold text-sm focus-visible:ring-2 focus-visible:ring-teal-700"
                aria-label="View Today's Medications"
              >
                <Pill className="w-4 h-4 mr-1.5 text-teal-700" aria-hidden="true" />
                <span>View Medications</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScrollTo("upcoming-appointments-section", "appointments")}
                className="h-11 px-4 border-navy-200 text-navy-900 hover:bg-white hover:border-teal-600 font-bold text-sm focus-visible:ring-2 focus-visible:ring-teal-700"
                aria-label="View Upcoming Appointments"
              >
                <Calendar className="w-4 h-4 mr-1.5 text-teal-700" aria-hidden="true" />
                <span>View Appointments</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScrollTo("adherence-summary-section", "adherence")}
                className="h-11 px-4 border-navy-200 text-navy-900 hover:bg-white hover:border-teal-600 font-bold text-sm focus-visible:ring-2 focus-visible:ring-teal-700"
                aria-label="Review Medication Adherence"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-700" aria-hidden="true" />
                <span>Review Adherence</span>
              </Button>
            </div>

            {/* Zero-Hallucination Safe Clinical Disclaimer */}
            <div className="flex items-center gap-1.5 text-[11px] text-navy-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
              <span>Prescription-verified guidance • No automated dosing changes</span>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
