"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { formatElderTime } from "@/lib/utils";
import { Medication } from "@/lib/types/medication";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { MedicationModal } from "@/components/dashboard/medication-modal";
import {
  Pill,
  Clock,
  Plus,
  Utensils,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Pencil,
  Trash,
  Sparkles,
} from "lucide-react";

export default function MedicationsPage() {
  const {
    user,
    activeProfile,
    memberships,
    medications,
    addMedication,
    updateMedication,
    deleteMedication,
    isDemoMode,
  } = useAuth();

  const [filter, setFilter] = useState<"all" | "active">("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [deleteConfirmMed, setDeleteConfirmMed] = useState<Medication | null>(null);
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
    Boolean(currentMembership?.permissions.includes("manage_medications"));

  const filteredMeds = medications.filter((m) =>
    filter === "all" ? true : m.status === "active"
  );

  const handleOpenAdd = () => {
    setEditingMed(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (med: Medication) => {
    setEditingMed(med);
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<Medication>) => {
    if (editingMed) {
      await updateMedication(editingMed.id, data);
    } else {
      await addMedication(data);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmMed) return;
    try {
      setDeleting(true);
      await deleteMedication(deleteConfirmMed.id);
      setDeleteConfirmMed(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
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
            Prescribed Medications & Regimen
          </h1>
          <p className="text-base text-navy-600 mt-1">
            Complete daily dosage schedules, food interactions, and refill status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="teal" size="lg">
            {medications.length} Prescriptions Listed
          </Badge>

          {canManage && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleOpenAdd}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-2 shadow-sm min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              <span>Add Prescribed Medication</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-100 pb-2">
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            filter === "active"
              ? "bg-teal-700 text-white"
              : "bg-white text-navy-700 hover:bg-navy-50"
          }`}
        >
          Active Regimen ({medications.filter((m) => m.status === "active").length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            filter === "all"
              ? "bg-teal-700 text-white"
              : "bg-white text-navy-700 hover:bg-navy-50"
          }`}
        >
          All Medications ({medications.length})
        </button>
      </div>

      {/* Empty State */}
      {filteredMeds.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-300">
          <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-3xl mx-auto flex items-center justify-center mb-3">
            <Pill className="w-8 h-8" />
          </div>
          <p className="text-xl font-black text-navy-900">No Medications Found</p>
          <p className="text-base text-navy-600 mt-1 max-w-md mx-auto">
            {filter === "active"
              ? "No active prescriptions currently on record."
              : "No medications have been added to this care profile yet."}
          </p>
          {canManage && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleOpenAdd}
              className="mt-4 bg-teal-700 hover:bg-teal-800 text-white font-bold"
            >
              Add First Prescribed Medication
            </Button>
          )}
        </div>
      ) : (
        /* Medication Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMeds.map((med) => {
            return (
              <Card
                key={med.id}
                className="border-2 border-navy-100 shadow-md hover:border-teal-300 transition"
              >
                <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl shrink-0">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-navy-900">{med.name}</CardTitle>
                      {med.genericName && (
                        <p className="text-xs text-navy-500 font-medium">{med.genericName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm" className="capitalize">
                      {med.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-teal-900 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                      Dosage: {med.dosage}
                    </span>
                    <span className="text-xs font-bold text-navy-700 bg-navy-50 px-2.5 py-1 rounded-xl border border-navy-200 capitalize">
                      {med.frequency.replace(/_/g, " ")}
                    </span>
                    {med.pillVisual?.color && (
                      <span className="text-xs font-semibold text-navy-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                        Visual: {med.pillVisual.color} {med.pillVisual.shape}
                      </span>
                    )}
                  </div>

                  {/* Schedule times */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="text-xs font-bold text-navy-600 uppercase tracking-wider block">
                      Daily Schedule:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {med.scheduleTimes.map((st, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-sm font-bold text-navy-900 bg-white px-2.5 py-1 rounded-lg border border-navy-200"
                        >
                          <Clock className="w-3.5 h-3.5 text-teal-700" />
                          {formatElderTime(st.time)} ({st.label})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Clinical instructions & Doctor */}
                  {med.specialInstructions && (
                    <p className="text-sm text-navy-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                      <strong>Instructions:</strong> {med.specialInstructions}
                    </p>
                  )}

                  <div className="text-xs text-navy-600 space-y-1 pt-1">
                    {med.prescribedFor && (
                      <p>
                        <strong>Prescribed For:</strong> {med.prescribedFor}
                      </p>
                    )}
                    {med.prescribingDoctor && (
                      <p>
                        <strong>Prescribing Clinician:</strong> {med.prescribingDoctor}
                      </p>
                    )}
                    {med.refillReminder?.enabled && (
                      <p className="text-teal-800 font-semibold">
                        Refill status: {med.refillReminder.remainingDoses} doses remaining
                      </p>
                    )}
                  </div>

                  {/* Caregiver/Patient Action Controls */}
                  {canManage && (
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-navy-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(med)}
                        className="border-navy-300 text-navy-800 hover:bg-navy-50 font-bold flex items-center gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5 text-teal-700" />
                        <span>Edit Regimen</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmMed(med)}
                        className="border-red-200 text-red-700 hover:bg-red-50 font-bold flex items-center gap-1.5"
                      >
                        <Trash className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Medication Add/Edit Modal */}
      <MedicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editingMed}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deleteConfirmMed)}
        onClose={() => setDeleteConfirmMed(null)}
        title="Remove Medication from Regimen"
        description="Are you sure you want to delete this prescription?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-base text-navy-800">
            Removing <strong>{deleteConfirmMed?.name}</strong> will remove it from daily dosage schedules and adherence tracking.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteConfirmMed(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
