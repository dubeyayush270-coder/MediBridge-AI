"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { formatElderTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pill,
  Clock,
  Plus,
  Utensils,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function MedicationsPage() {
  const { medications, adherenceLogs, logMedicationDose } = useAuth();
  const [filter, setFilter] = useState<"all" | "active">("active");

  const filteredMeds = medications.filter((m) =>
    filter === "all" ? true : m.status === "active"
  );

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
            {medications.length} Prescriptions Active
          </Badge>
        </div>
      </div>

      {/* Medication List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMeds.map((med) => {
          return (
            <Card key={med.id} className="border-2 border-navy-100 shadow-md hover:border-teal-300 transition">
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
                <Badge variant="success" size="sm" className="capitalize">
                  {med.status}
                </Badge>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-teal-900 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                    Dosage: {med.dosage}
                  </span>
                  <span className="text-xs font-bold text-navy-700 bg-navy-50 px-2.5 py-1 rounded-xl border border-navy-200 capitalize">
                    {med.frequency.replace(/_/g, " ")}
                  </span>
                  {med.route && (
                    <span className="text-xs text-navy-600 bg-stone-100 px-2 py-0.5 rounded-lg">
                      {med.route}
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
                  {med.refillReminder.enabled && (
                    <p className="text-teal-800 font-semibold">
                      Refill status: {med.refillReminder.remainingDoses} doses remaining (Next refill around {med.refillReminder.refillAtDate})
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
