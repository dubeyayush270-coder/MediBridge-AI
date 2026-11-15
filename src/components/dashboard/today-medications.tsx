"use client";

import React, { useState } from "react";
import { Medication, MedicationAdherenceLog } from "@/lib/types/medication";
import { formatElderTime } from "@/lib/utils";
import { generateTodaySchedule } from "@/lib/utils/adherence";
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
  Plus,
  AlertTriangle,
  Pencil,
  Trash2,
  ListFilter,
  CalendarCheck,
} from "lucide-react";

interface TodayMedicationsProps {
  medications: Medication[];
  adherenceLogs: MedicationAdherenceLog[];
  onLogDose: (
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
  ) => void;
  onAddMedication?: () => void;
  onEditMedication?: (med: Medication) => void;
  onDeleteMedication?: (medId: string) => Promise<void> | void;
  canManageMedications?: boolean;
}

export function TodayMedications({
  medications,
  adherenceLogs,
  onLogDose,
  onAddMedication,
  onEditMedication,
  onDeleteMedication,
  canManageMedications = false,
}: TodayMedicationsProps) {
  const [activeTab, setActiveTab] = useState<"schedule" | "regimens">("schedule");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Compute timezone-aware today schedule dynamically from prescriptions
  const todayDoses: MedicationAdherenceLog[] = generateTodaySchedule(medications, adherenceLogs);
  const takenCount = todayDoses.filter((d) => d.status === "taken").length;
  const totalCount = todayDoses.length;

  const handleMarkTaken = (dose: MedicationAdherenceLog) => {
    onLogDose(dose.id, "taken", {
      medicationId: dose.medicationId,
      medicationName: dose.medicationName,
      dosage: dose.dosage,
      scheduledTime: dose.scheduledTime,
      scheduledDate: dose.scheduledDate,
    });
    setSuccessToast(`Great job! Marked ${dose.medicationName} as taken.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleMarkSkipped = (dose: MedicationAdherenceLog) => {
    onLogDose(dose.id, "skipped", {
      medicationId: dose.medicationId,
      medicationName: dose.medicationName,
      dosage: dose.dosage,
      scheduledTime: dose.scheduledTime,
      scheduledDate: dose.scheduledDate,
    });
    setSuccessToast(`Recorded that you skipped ${dose.medicationName}. Notified your care circle.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleMarkMissed = (dose: MedicationAdherenceLog) => {
    onLogDose(dose.id, "missed", {
      medicationId: dose.medicationId,
      medicationName: dose.medicationName,
      dosage: dose.dosage,
      scheduledTime: dose.scheduledTime,
      scheduledDate: dose.scheduledDate,
    });
    setSuccessToast(`Marked ${dose.medicationName} as missed.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleConfirmDelete = async (medId: string, name: string) => {
    if (!onDeleteMedication) return;
    try {
      setDeletingId(medId);
      setDeleteError(null);
      await onDeleteMedication(medId);
      setConfirmDeleteId(null);
      setSuccessToast(`Removed medication "${name}" from prescribed regimens.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete medication. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-2 border-navy-100 shadow-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-100 text-teal-800 rounded-2xl shrink-0">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <CardTitle className="text-2xl text-navy-900">
              {activeTab === "schedule" ? "Today's Medications" : "Prescribed Regimens"}
            </CardTitle>
            <CardDescription className="text-base text-navy-600">
              {activeTab === "schedule"
                ? "Prescribed daily doses with 1-tap adherence tracking"
                : "Active doctor prescriptions, dosages, and refill reminders"}
            </CardDescription>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle Tabs */}
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "schedule"
                  ? "bg-white text-teal-900 shadow-sm"
                  : "text-stone-600 hover:text-navy-900"
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Today ({totalCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("regimens")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "regimens"
                  ? "bg-white text-teal-900 shadow-sm"
                  : "text-stone-600 hover:text-navy-900"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>All ({medications.length})</span>
            </button>
          </div>

          {totalCount > 0 && activeTab === "schedule" && (
            <Badge variant="teal" size="md" className="text-sm font-bold px-3 py-1">
              {takenCount} of {totalCount} Taken
            </Badge>
          )}

          {canManageMedications && onAddMedication && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddMedication}
              className="border-teal-600 text-teal-800 hover:bg-teal-50 font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Add Medication</span>
            </Button>
          )}
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

        {deleteError && (
          <div
            role="alert"
            className="mb-4 p-4 bg-red-50 border-2 border-red-300 text-red-900 rounded-2xl flex items-center gap-3"
          >
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <p className="text-sm font-bold">{deleteError}</p>
          </div>
        )}

        {/* TAB 1: TODAY'S SCHEDULE */}
        {activeTab === "schedule" && (
          <>
            {totalCount === 0 ? (
              <div className="text-center py-12 px-4 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300">
                <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-3xl mx-auto flex items-center justify-center mb-3">
                  <Pill className="w-8 h-8" />
                </div>
                <p className="text-xl font-black text-navy-900">No Medications Scheduled Today</p>
                <p className="text-base text-navy-600 mt-1 max-w-md mx-auto">
                  Add your prescribed medications to start tracking daily doses, meal timings, and refill alerts.
                </p>
                {onAddMedication && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={onAddMedication}
                    className="mt-4 bg-teal-700 hover:bg-teal-800 text-white font-bold"
                  >
                    Add First Medication
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {todayDoses.map((dose) => {
                  const med = medications.find((m) => m.id === dose.medicationId);
                  const isTaken = dose.status === "taken";
                  const isSkipped = dose.status === "skipped";
                  const isMissed = dose.status === "missed";

                  return (
                    <div
                      key={dose.id}
                      className={`p-5 rounded-2xl border-2 transition-all ${
                        isTaken
                          ? "bg-emerald-50/70 border-emerald-300"
                          : isSkipped
                          ? "bg-stone-100 border-stone-300 opacity-80"
                          : isMissed
                          ? "bg-amber-50/80 border-amber-300"
                          : "bg-white border-teal-200 shadow-sm hover:border-teal-400"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Medication Details */}
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                              isTaken
                                ? "bg-emerald-600 text-white border-emerald-700"
                                : isMissed
                                ? "bg-amber-500 text-white border-amber-600"
                                : isSkipped
                                ? "bg-stone-200 text-stone-600 border-stone-300"
                                : "bg-teal-50 text-teal-800 border-teal-200"
                            }`}
                          >
                            {isTaken ? (
                              <CheckCircle2 className="w-8 h-8" />
                            ) : isMissed ? (
                              <AlertTriangle className="w-8 h-8" />
                            ) : isSkipped ? (
                              <XCircle className="w-8 h-8" />
                            ) : (
                              <Pill className="w-7 h-7" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xl sm:text-2xl font-black text-navy-900">
                                {dose.medicationName}
                              </h4>
                              <span className="text-base font-bold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-lg border border-teal-200">
                                {dose.dosage}
                              </span>
                              {med?.pillVisual?.color && (
                                <span className="text-xs font-semibold text-navy-700 bg-navy-50 px-2.5 py-0.5 rounded-md border border-navy-200">
                                  {med.pillVisual.color} {med.pillVisual.shape}
                                </span>
                              )}
                              {canManageMedications && med && onEditMedication && (
                                <button
                                  type="button"
                                  onClick={() => onEditMedication(med)}
                                  className="text-stone-400 hover:text-teal-700 p-1"
                                  title="Edit prescription regimen"
                                  aria-label={`Edit ${med.name}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Schedule Time & Food Instructions */}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-navy-700 pt-1">
                              <span className="flex items-center gap-1.5 font-bold text-navy-900">
                                <Clock className="w-4 h-4 text-teal-700" />
                                Scheduled: {formatElderTime(dose.scheduledTime)}
                              </span>

                              <span className="flex items-center gap-1 text-navy-600">
                                <Utensils className="w-4 h-4 text-amber-700" />
                                {med?.withFood ? "Take with meal / food" : "Can take on empty stomach"}
                              </span>
                            </div>

                            {med?.specialInstructions && (
                              <p className="text-sm text-navy-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 font-medium">
                                <strong>Note:</strong> {med.specialInstructions}
                              </p>
                            )}

                            {dose.loggedAt && (
                              <p className="text-xs text-navy-500 italic pt-0.5">
                                Logged at {formatElderTime(new Date(dose.loggedAt))}
                                {dose.loggedBy ? ` by ${dose.loggedBy.userName}` : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions & Status Buttons (Elder-Friendly 56px+ Targets) */}
                        <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                          {isTaken ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="success" size="lg" className="px-4 py-2 text-base font-bold">
                                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                                <span>Taken</span>
                              </Badge>
                              <button
                                onClick={() => handleMarkSkipped(dose)}
                                className="text-xs text-navy-500 hover:text-navy-800 underline p-1 font-semibold"
                              >
                                Change to Skipped
                              </button>
                            </div>
                          ) : isSkipped ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="neutral" size="lg" className="px-4 py-2 text-base font-bold">
                                <XCircle className="w-5 h-5 text-stone-600" />
                                <span>Skipped</span>
                              </Badge>
                              <button
                                onClick={() => handleMarkTaken(dose)}
                                className="text-xs text-teal-700 hover:text-teal-900 underline font-bold p-1"
                              >
                                Change to Taken
                              </button>
                            </div>
                          ) : isMissed ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="warning" size="lg" className="px-4 py-2 text-base font-bold">
                                <AlertTriangle className="w-5 h-5 text-amber-700" />
                                <span>Missed</span>
                              </Badge>
                              <button
                                onClick={() => handleMarkTaken(dose)}
                                className="text-xs text-teal-700 hover:text-teal-900 underline font-bold p-1"
                              >
                                Mark as Taken
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                              <Button
                                variant="primary"
                                size="lg"
                                onClick={() => handleMarkTaken(dose)}
                                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-lg px-6 py-3 min-h-[56px] shadow-md flex items-center gap-2"
                              >
                                <CheckCircle2 className="w-6 h-6" />
                                <span>I Took This</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="md"
                                onClick={() => handleMarkSkipped(dose)}
                                className="border-navy-300 text-navy-700 hover:bg-navy-50 text-sm font-semibold min-h-[56px] px-4"
                              >
                                Skip
                              </Button>
                              <Button
                                variant="outline"
                                size="md"
                                onClick={() => handleMarkMissed(dose)}
                                className="border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold min-h-[56px] px-3"
                              >
                                Missed
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
          </>
        )}

        {/* TAB 2: ALL PRESCRIBED REGIMENS (PHASE 3 CRUD) */}
        {activeTab === "regimens" && (
          <>
            {medications.length === 0 ? (
              <div className="text-center py-12 px-4 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300">
                <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-3xl mx-auto flex items-center justify-center mb-3">
                  <Pill className="w-8 h-8" />
                </div>
                <p className="text-xl font-black text-navy-900">No Medications Prescribed</p>
                <p className="text-base text-navy-600 mt-1 max-w-md mx-auto">
                  Add prescriptions to track dosage schedules, meals, and refill reminders.
                </p>
                {onAddMedication && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={onAddMedication}
                    className="mt-4 bg-teal-700 hover:bg-teal-800 text-white font-bold"
                  >
                    Add First Medication
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {medications.map((med) => {
                  const isDeletingThis = deletingId === med.id;
                  const isConfirmingThis = confirmDeleteId === med.id;

                  return (
                    <div
                      key={med.id}
                      className="p-5 rounded-2xl border-2 border-navy-100 bg-white hover:border-teal-300 transition-all shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xl sm:text-2xl font-black text-navy-900">
                              {med.name}
                            </h4>
                            <span className="text-base font-bold text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-lg border border-teal-200">
                              {med.dosage}
                            </span>
                            {med.genericName && (
                              <span className="text-xs text-navy-500 font-medium italic">
                                ({med.genericName})
                              </span>
                            )}
                            <Badge variant="teal" size="sm" className="capitalize">
                              {med.frequency.replace(/_/g, " ")}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-navy-700 pt-1">
                            <span className="flex items-center gap-1.5 font-bold text-navy-900">
                              <Clock className="w-4 h-4 text-teal-700" />
                              Times:{" "}
                              {med.scheduleTimes
                                .map((st) => `${formatElderTime(st.time)} (${st.label})`)
                                .join(", ")}
                            </span>
                            <span className="flex items-center gap-1 text-navy-600">
                              <Utensils className="w-4 h-4 text-amber-700" />
                              {med.withFood ? "With food" : "Empty stomach"}
                            </span>
                            {med.pillVisual?.color && (
                              <span className="text-xs text-navy-600 bg-stone-100 px-2 py-0.5 rounded">
                                {med.pillVisual.color} {med.pillVisual.shape}
                              </span>
                            )}
                          </div>

                          {med.specialInstructions && (
                            <p className="text-sm text-navy-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 font-medium">
                              <strong>Instructions:</strong> {med.specialInstructions}
                            </p>
                          )}

                          {med.prescribingDoctor && (
                            <p className="text-xs text-navy-600">
                              <strong>Prescribed by:</strong> {med.prescribingDoctor}
                              {med.prescribedFor ? ` (for ${med.prescribedFor})` : ""}
                            </p>
                          )}

                          {med.refillReminder?.enabled && (
                            <p className="text-xs text-teal-800 font-semibold">
                              📦 Refill alert: {med.refillReminder.remainingDoses ?? 30} doses remaining
                            </p>
                          )}
                        </div>

                        {/* Edit & Delete Action Buttons (Phase 3 CRUD) */}
                        {canManageMedications && (
                          <div className="flex md:flex-col items-center gap-2 shrink-0 self-end md:self-start pt-2 md:pt-0">
                            {isConfirmingThis ? (
                              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl space-y-2 text-right">
                                <p className="text-xs font-bold text-red-900">Delete this medication?</p>
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-xs py-1 px-2 border-stone-300 text-stone-700 hover:bg-stone-100"
                                    disabled={isDeletingThis}
                                  >
                                    Keep
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConfirmDelete(med.id, med.name)}
                                    className="text-xs py-1 px-2 bg-red-600 hover:bg-red-700 text-white font-bold border-red-700"
                                    isLoading={isDeletingThis}
                                  >
                                    Yes, Delete
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {onEditMedication && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEditMedication(med)}
                                    className="border-teal-300 text-teal-800 hover:bg-teal-50 font-semibold flex items-center gap-1.5 px-3 py-1.5"
                                    aria-label={`Edit ${med.name}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-teal-700" />
                                    <span>Edit</span>
                                  </Button>
                                )}
                                {onDeleteMedication && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmDeleteId(med.id)}
                                    className="border-stone-300 text-stone-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 font-semibold flex items-center gap-1.5 px-3 py-1.5"
                                    aria-label={`Delete ${med.name}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-stone-500 hover:text-red-600" />
                                    <span>Delete</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
