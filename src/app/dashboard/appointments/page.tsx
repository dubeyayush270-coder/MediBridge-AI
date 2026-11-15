"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { formatElderDate, formatElderTime } from "@/lib/utils";
import { Appointment } from "@/lib/types/appointment";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AppointmentModal } from "@/components/dashboard/appointment-modal";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  UserCheck,
  AlertTriangle,
  HelpCircle,
  Plus,
  Pencil,
  Trash,
} from "lucide-react";

export default function AppointmentsPage() {
  const {
    user,
    activeProfile,
    memberships,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    isDemoMode,
  } = useAuth();

  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [deleteConfirmApt, setDeleteConfirmApt] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // RBAC check
  const currentMembership = memberships.find(
    (m) => m.userId === user?.uid && m.profileId === activeProfile?.id
  );
  const isCreator = activeProfile?.createdBy === user?.uid;
  const canManage =
    isDemoMode ||
    isCreator ||
    user?.role === "caregiver" ||
    user?.role === "family_member" ||
    Boolean(currentMembership?.permissions.includes("manage_appointments"));

  const filteredApts = appointments
    .filter((a) => (filter === "all" ? true : a.status === "upcoming"))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const handleOpenAdd = () => {
    setEditingApt(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (apt: Appointment) => {
    setEditingApt(apt);
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<Appointment>) => {
    if (editingApt) {
      await updateAppointment(editingApt.id, data);
    } else {
      await addAppointment(data);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmApt) return;
    try {
      setDeleting(true);
      await deleteAppointment(deleteConfirmApt.id);
      setDeleteConfirmApt(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight">
            Medical Consultations & Appointments
          </h1>
          <p className="text-base text-navy-600 mt-1">
            Track scheduled clinic visits, companion escorts, and preparation instructions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="teal" size="lg">
            {appointments.length} Consultations Listed
          </Badge>

          {canManage && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleOpenAdd}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-2 shadow-sm min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              <span>Schedule Doctor Consultation</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-100 pb-2">
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            filter === "upcoming"
              ? "bg-teal-700 text-white"
              : "bg-white text-navy-700 hover:bg-navy-50"
          }`}
        >
          Upcoming ({appointments.filter((a) => a.status === "upcoming").length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            filter === "all"
              ? "bg-teal-700 text-white"
              : "bg-white text-navy-700 hover:bg-navy-50"
          }`}
        >
          All Appointments ({appointments.length})
        </button>
      </div>

      {/* Empty State */}
      {filteredApts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-300">
          <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-3xl mx-auto flex items-center justify-center mb-3">
            <Calendar className="w-8 h-8" />
          </div>
          <p className="text-xl font-black text-navy-900">No Appointments Scheduled</p>
          <p className="text-base text-navy-600 mt-1 max-w-md mx-auto">
            {filter === "upcoming"
              ? "No upcoming clinical consultations are scheduled right now."
              : "No doctor appointments recorded on this care profile."}
          </p>
          {canManage && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleOpenAdd}
              className="mt-4 bg-teal-700 hover:bg-teal-800 text-white font-bold"
            >
              Schedule First Consultation
            </Button>
          )}
        </div>
      ) : (
        /* Appointment Cards */
        <div className="space-y-4">
          {filteredApts.map((apt) => {
            const aptDate = new Date(apt.dateTime);
            return (
              <Card key={apt.id} className="border-2 border-navy-100 shadow-md">
                <CardHeader className="pb-3 border-b border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-navy-900">{apt.title}</CardTitle>
                      <p className="text-base font-bold text-teal-800">
                        {apt.doctorName} • {apt.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="navy" size="md">
                      {formatElderDate(aptDate)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-base text-navy-800 font-bold">
                      <Clock className="w-5 h-5 text-teal-700" />
                      <span>
                        {formatElderTime(aptDate)} ({apt.durationMinutes} minutes)
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-navy-700">
                      <MapPin className="w-5 h-5 text-navy-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-navy-900">{apt.clinicName}</p>
                        <p>{apt.address}</p>
                        {apt.phone && (
                          <p className="pt-1">
                            Phone:{" "}
                            <a href={`tel:${apt.phone}`} className="text-teal-700 font-semibold underline">
                              {apt.phone}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-navy-800">
                      <strong>Consultation Objective:</strong> {apt.purpose}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {apt.preparationNotes && (
                      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-950 font-medium flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Preparation Required:</strong> {apt.preparationNotes}
                        </div>
                      </div>
                    )}

                    {apt.questionsToAsk && apt.questionsToAsk.length > 0 && (
                      <div className="p-3.5 bg-navy-50 rounded-xl border border-navy-200">
                        <h4 className="text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
                          Questions to Ask Doctor:
                        </h4>
                        <ul className="list-disc list-inside text-sm text-navy-800 space-y-1 font-medium">
                          {apt.questionsToAsk.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {apt.assignedCompanion ? (
                        <div className="flex items-center gap-2 text-sm font-semibold text-teal-900 bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                          <UserCheck className="w-4 h-4 text-teal-700" />
                          <span>Companion Escort: {apt.assignedCompanion.userName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-navy-500">No companion escort assigned</span>
                      )}

                      {apt.transportAssistanceNeeded && (
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                          🚗 Transport Requested
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    {canManage && (
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(apt)}
                          className="border-navy-300 text-navy-800 hover:bg-navy-50 font-bold flex items-center gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5 text-teal-700" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirmApt(apt)}
                          className="border-red-200 text-red-700 hover:bg-red-50 font-bold flex items-center gap-1.5"
                        >
                          <Trash className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editingApt}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deleteConfirmApt)}
        onClose={() => setDeleteConfirmApt(null)}
        title="Cancel & Delete Consultation"
        description="Are you sure you want to remove this appointment?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-base text-navy-800">
            Removing <strong>{deleteConfirmApt?.title}</strong> on{" "}
            {deleteConfirmApt && formatElderDate(new Date(deleteConfirmApt.dateTime))} with{" "}
            {deleteConfirmApt?.doctorName} will cancel scheduled reminders.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteConfirmApt(null)}
              disabled={deleting}
            >
              Keep Appointment
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {deleting ? "Deleting..." : "Cancel Appointment"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
