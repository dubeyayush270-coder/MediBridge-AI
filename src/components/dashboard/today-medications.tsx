"use client";

import React, { useState } from "react";
import { Medication, MedicationAdherenceLog } from "@/lib/types/medication";
import { formatElderTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertCircle,
  Utensils,
  XCircle,
  HelpCircle,
} from "lucide-react";

interface TodayMedicationsProps {
  medications: Medication[];
  adherenceLogs: MedicationAdherenceLog[];
  onLogDose: (logId: string, status: "taken" | "skipped") => void;
}

export function TodayMedications({
  medications,
  adherenceLogs,
  onLogDose,
}: TodayMedicationsProps) {
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleMarkTaken = (logId: string, medName: string) => {
    onLogDose(logId, "taken");
    setSuccessToast(`Great job! Marked ${medName} as taken.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleMarkSkipped = (logId: string, medName: string) => {
    onLogDose(logId, "skipped");
    setSuccessToast(`Recorded that you skipped ${medName}. Notified your care team.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <Card className="border-2 border-navy-100 shadow-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl text-navy-900">Today's Medications</CardTitle>
              <CardDescription className="text-base text-navy-600">
                Prescribed doses scheduled for today
              </CardDescription>
            </div>
          </div>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-2">
          <Badge variant="teal" size="md">
            {adherenceLogs.filter((l) => l.status === "taken").length} of {adherenceLogs.length} Taken
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {successToast && (
          <div
            role="status"
            className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3 animate-in fade-in"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <p className="text-base font-bold">{successToast}</p>
          </div>
        )}

        {adherenceLogs.length === 0 ? (
          <div className="text-center py-10 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
            <Pill className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <p className="text-lg font-bold text-navy-900">No medications scheduled for today</p>
            <p className="text-sm text-navy-600 mt-1">
              Add medications to your regimen to track them here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {adherenceLogs.map((log) => {
              const med = medications.find((m) => m.id === log.medicationId);
              const isTaken = log.status === "taken";
              const isSkipped = log.status === "skipped";
              const isPending = log.status === "pending";

              return (
                <div
                  key={log.id}
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    isTaken
                      ? "bg-emerald-50/60 border-emerald-200"
                      : isSkipped
                      ? "bg-stone-100 border-stone-300 opacity-75"
                      : "bg-white border-teal-200 shadow-sm hover:border-teal-400"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Medication Details */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isTaken
                            ? "bg-emerald-600 text-white border-emerald-700"
                            : "bg-teal-50 text-teal-800 border-teal-200"
                        }`}
                      >
                        {isTaken ? (
                          <CheckCircle2 className="w-8 h-8" />
                        ) : (
                          <Pill className="w-7 h-7" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xl sm:text-2xl font-black text-navy-900">
                            {log.medicationName}
                          </h4>
                          <span className="text-base font-bold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-lg border border-teal-200">
                            {log.dosage}
                          </span>
                          {med?.pillVisual?.color && (
                            <span className="text-xs font-semibold text-navy-600 bg-navy-50 px-2 py-0.5 rounded-md border border-navy-200">
                              Appearance: {med.pillVisual.color} {med.pillVisual.shape}
                            </span>
                          )}
                        </div>

                        {/* Schedule Time & Food Instructions */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-navy-700 pt-1">
                          <span className="flex items-center gap-1.5 font-bold text-navy-900">
                            <Clock className="w-4 h-4 text-teal-700" />
                            Scheduled: {formatElderTime(log.scheduledTime)}
                          </span>

                          {med?.withFood !== undefined && (
                            <span className="flex items-center gap-1 text-navy-600">
                              <Utensils className="w-4 h-4 text-amber-700" />
                              {med.withFood ? "Take with meal / food" : "Can take on empty stomach"}
                            </span>
                          )}
                        </div>

                        {med?.specialInstructions && (
                          <p className="text-sm text-navy-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60 font-medium">
                            <strong>Note:</strong> {med.specialInstructions}
                          </p>
                        )}

                        {log.loggedAt && (
                          <p className="text-xs text-navy-500 italic">
                            Logged at {formatElderTime(new Date(log.loggedAt))}
                            {log.loggedBy ? ` by ${log.loggedBy.userName}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions & Status */}
                    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                      {isTaken ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="success" size="lg" className="px-4 py-2 text-base">
                            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                            <span>Taken</span>
                          </Badge>
                          <button
                            onClick={() => onLogDose(log.id, "skipped")}
                            className="text-xs text-navy-500 hover:text-navy-800 underline p-1"
                          >
                            Change
                          </button>
                        </div>
                      ) : isSkipped ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral" size="lg" className="px-4 py-2 text-base">
                            <XCircle className="w-5 h-5 text-stone-600" />
                            <span>Skipped</span>
                          </Badge>
                          <button
                            onClick={() => onLogDose(log.id, "taken")}
                            className="text-xs text-teal-700 hover:text-teal-900 underline font-semibold p-1"
                          >
                            Mark Taken
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="lg"
                            onClick={() => handleMarkTaken(log.id, log.medicationName)}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-lg px-6 py-3 min-h-[52px] shadow-md flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-6 h-6" />
                            <span>I Took This</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => handleMarkSkipped(log.id, log.medicationName)}
                            className="border-navy-300 text-navy-700 hover:bg-navy-50 text-sm font-semibold min-h-[52px]"
                          >
                            Skip
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
