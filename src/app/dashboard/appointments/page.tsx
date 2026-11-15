"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { formatElderDate, formatElderTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  UserCheck,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

export default function AppointmentsPage() {
  const { appointments } = useAuth();

  return (
    <div className="space-y-6 pb-12">
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

        <Badge variant="teal" size="lg">
          {appointments.length} Consultations Listed
        </Badge>
      </div>

      <div className="space-y-4">
        {appointments.map((apt) => {
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
                <Badge variant="navy" size="md">
                  {formatElderDate(aptDate)}
                </Badge>
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

                  {apt.assignedCompanion && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-teal-900 bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                      <UserCheck className="w-4 h-4 text-teal-700" />
                      <span>Companion Escort: {apt.assignedCompanion.userName}</span>
                    </div>
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
