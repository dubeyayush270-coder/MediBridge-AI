"use client";

import React, { useState } from "react";
import { Appointment } from "@/lib/types/appointment";
import { formatElderDate, formatElderTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  UserCheck,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  onScheduleAppointment?: () => void;
  onEditAppointment?: (apt: Appointment) => void;
  onDeleteAppointment?: (aptId: string) => Promise<void> | void;
  canManageAppointments?: boolean;
}

export function UpcomingAppointments({
  appointments,
  onScheduleAppointment,
  onEditAppointment,
  onDeleteAppointment,
  canManageAppointments = false,
}: UpcomingAppointmentsProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const upcomingList = appointments
    .filter((a) => a.status === "upcoming")
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const handleConfirmDelete = async (aptId: string, title: string) => {
    if (!onDeleteAppointment) return;
    try {
      setDeletingId(aptId);
      setDeleteError(null);
      await onDeleteAppointment(aptId);
      setConfirmDeleteId(null);
      setToastMessage(`Cancelled consultation "${title}".`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to cancel appointment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-2 border-navy-100 shadow-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-navy-100 text-navy-800 rounded-2xl shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <CardTitle className="text-2xl text-navy-900">Upcoming Appointments</CardTitle>
            <CardDescription className="text-base text-navy-600">
              Doctor visits, clinical consultations, and escort companions
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="navy" size="md" className="text-sm font-bold px-3 py-1">
            {upcomingList.length} Scheduled
          </Badge>

          {canManageAppointments && onScheduleAppointment && (
            <Button
              variant="outline"
              size="sm"
              onClick={onScheduleAppointment}
              className="border-navy-600 text-navy-900 hover:bg-navy-50 font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-navy-700" />
              <span>Schedule Visit</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {toastMessage && (
          <div
            role="status"
            className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <p className="text-base font-bold">{toastMessage}</p>
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

        {upcomingList.length === 0 ? (
          <div className="text-center py-12 px-4 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-3xl mx-auto flex items-center justify-center mb-3">
              <Calendar className="w-8 h-8" />
            </div>
            <p className="text-xl font-black text-navy-900">No Upcoming Appointments</p>
            <p className="text-base text-navy-600 mt-1 max-w-md mx-auto">
              Your consultation schedule is currently clear. Schedule a clinical checkup or doctor visit whenever needed.
            </p>
            {onScheduleAppointment && (
              <Button
                variant="primary"
                size="md"
                onClick={onScheduleAppointment}
                className="mt-4 bg-teal-700 hover:bg-teal-800 text-white font-bold"
              >
                Schedule Consultation
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingList.map((apt) => {
              const aptDate = new Date(apt.dateTime);
              const isDeletingThis = deletingId === apt.id;
              const isConfirmingThis = confirmDeleteId === apt.id;

              return (
                <div
                  key={apt.id}
                  className="p-5 rounded-2xl border-2 border-navy-100 bg-white hover:border-teal-300 transition-all shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="teal" size="md">
                          {formatElderDate(aptDate)}
                        </Badge>
                        <span className="flex items-center gap-1 font-bold text-navy-900 text-sm">
                          <Clock className="w-4 h-4 text-teal-700" />
                          {formatElderTime(aptDate)} ({apt.durationMinutes} mins)
                        </span>
                      </div>

                      <h4 className="text-xl sm:text-2xl font-black text-navy-900">
                        {apt.title}
                      </h4>

                      <div className="space-y-1 text-base text-navy-700">
                        <p className="font-bold text-teal-800">
                          {apt.doctorName} • <span className="text-navy-600 font-medium">{apt.specialty}</span>
                        </p>
                        {apt.clinicName && (
                          <p className="flex items-center gap-1.5 text-navy-600 text-sm">
                            <MapPin className="w-4 h-4 text-navy-400 shrink-0" />
                            <span>
                              {apt.clinicName}
                              {apt.address ? ` — ${apt.address}` : ""}
                            </span>
                          </p>
                        )}
                        {apt.phone && (
                          <p className="flex items-center gap-1.5 text-navy-600 text-sm">
                            <Phone className="w-4 h-4 text-navy-400 shrink-0" />
                            <a href={`tel:${apt.phone}`} className="text-teal-700 underline font-semibold">
                              {apt.phone}
                            </a>
                          </p>
                        )}
                      </div>

                      {/* Preparation Notes */}
                      {apt.preparationNotes && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-950 font-medium flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>Preparation note:</strong> {apt.preparationNotes}
                          </div>
                        </div>
                      )}

                      {/* Questions to Ask Preview */}
                      {apt.questionsToAsk && apt.questionsToAsk.length > 0 && (
                        <div className="p-2.5 bg-navy-50 rounded-xl border border-navy-100 text-xs text-navy-800">
                          <span className="font-bold text-teal-800">Prepared Questions: </span>
                          <span>{apt.questionsToAsk.length} questions prepared for the doctor</span>
                        </div>
                      )}

                      {/* Companion & Transport */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {apt.assignedCompanion ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                            <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                            Accompanied by: {apt.assignedCompanion.userName}
                          </span>
                        ) : (
                          <span className="text-xs text-navy-500">No companion assigned</span>
                        )}
                        {apt.transportAssistanceNeeded && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            🚗 Transport Assistance Requested
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons (Phase 4 CRUD) */}
                    {canManageAppointments && (
                      <div className="flex md:flex-col items-center gap-2 shrink-0 self-end md:self-start pt-2 md:pt-0">
                        {isConfirmingThis ? (
                          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl space-y-2 text-right">
                            <p className="text-xs font-bold text-red-900">Cancel this appointment?</p>
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
                                onClick={() => handleConfirmDelete(apt.id, apt.title)}
                                className="text-xs py-1 px-2 bg-red-600 hover:bg-red-700 text-white font-bold border-red-700"
                                isLoading={isDeletingThis}
                              >
                                Yes, Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {onEditAppointment && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditAppointment(apt)}
                                className="border-teal-300 text-teal-800 hover:bg-teal-50 font-semibold flex items-center gap-1.5 px-3 py-1.5"
                                aria-label={`Edit ${apt.title}`}
                              >
                                <Pencil className="w-3.5 h-3.5 text-teal-700" />
                                <span>Edit</span>
                              </Button>
                            )}
                            {onDeleteAppointment && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmDeleteId(apt.id)}
                                className="border-stone-300 text-stone-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 font-semibold flex items-center gap-1.5 px-3 py-1.5"
                                aria-label={`Cancel ${apt.title}`}
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
      </CardContent>
    </Card>
  );
}
