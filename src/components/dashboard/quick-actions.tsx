"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CareProfile } from "@/lib/types/care-profile";
import {
  PhoneCall,
  ShieldAlert,
  Printer,
  CalendarPlus,
  Pill,
  HeartPulse,
  ExternalLink,
} from "lucide-react";

interface QuickActionsProps {
  activeProfile: CareProfile | null;
  onOpenCreateProfile: () => void;
}

export function QuickActions({ activeProfile, onOpenCreateProfile }: QuickActionsProps) {
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Card className="border-2 border-navy-100 shadow-md">
        <CardHeader className="pb-3 border-b border-navy-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-navy-900">Quick Actions</CardTitle>
              <p className="text-sm text-navy-600">Immediate access shortcuts</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Call Doctor */}
          {activeProfile?.primaryDoctor?.phone ? (
            <a
              href={`tel:${activeProfile.primaryDoctor.phone}`}
              className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-200 hover:bg-teal-100 hover:border-teal-400 text-teal-950 font-bold flex items-center gap-3 transition group"
            >
              <div className="p-2.5 bg-teal-600 text-white rounded-xl group-hover:scale-105 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-base leading-tight">Call Primary Doctor</span>
                <span className="text-xs text-teal-800 font-semibold">
                  {activeProfile.primaryDoctor.name}
                </span>
              </div>
            </a>
          ) : (
            <button
              onClick={() => alert("Please add a primary doctor in profile settings.")}
              className="p-4 rounded-2xl bg-stone-50 border-2 border-stone-200 text-stone-700 font-bold flex items-center gap-3 transition"
            >
              <PhoneCall className="w-5 h-5 text-stone-400" />
              <span>Call Primary Doctor</span>
            </button>
          )}

          {/* Emergency Info & Allergies */}
          <button
            onClick={() => setEmergencyModalOpen(true)}
            className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 hover:bg-red-100 hover:border-red-400 text-red-950 font-bold flex items-center gap-3 transition group text-left"
          >
            <div className="p-2.5 bg-red-600 text-white rounded-xl group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-base leading-tight">Emergency Info & Allergies</span>
              <span className="text-xs text-red-800 font-semibold">
                {activeProfile?.allergies?.length || 0} documented allergies
              </span>
            </div>
          </button>

          {/* Print Today's Summary */}
          <button
            onClick={handlePrint}
            className="p-4 rounded-2xl bg-navy-50 border-2 border-navy-200 hover:bg-navy-100 text-navy-950 font-bold flex items-center gap-3 transition group text-left"
          >
            <div className="p-2.5 bg-navy-800 text-white rounded-xl group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-base leading-tight">Print Daily Sheet</span>
              <span className="text-xs text-navy-600 font-medium">For fridge or caregiver desk</span>
            </div>
          </button>

          {/* New Care Profile */}
          <button
            onClick={onOpenCreateProfile}
            className="p-4 rounded-2xl bg-white border-2 border-teal-200 hover:bg-teal-50 text-teal-900 font-bold flex items-center gap-3 transition group text-left"
          >
            <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl group-hover:scale-105 transition-transform">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-base leading-tight">Create Care Profile</span>
              <span className="text-xs text-teal-700 font-medium">Add another loved one</span>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Emergency & Allergy Dialog */}
      <Dialog
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        title="Emergency Medical Information"
        description="Crucial details for emergency personnel and first responders"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-300">
            <h4 className="text-lg font-bold text-red-950 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-700" />
              Documented Drug & Food Allergies
            </h4>
            {activeProfile?.allergies && activeProfile.allergies.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-base text-red-900 font-semibold">
                {activeProfile.allergies.map((allergy, idx) => (
                  <li key={idx}>{allergy}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-red-800 font-medium">No allergies recorded.</p>
            )}
          </div>

          <div className="p-4 bg-navy-50 rounded-2xl border border-navy-200 space-y-2 text-sm">
            <p className="text-navy-900 font-bold">
              Patient: <span className="font-normal">{activeProfile?.patientName}</span>
            </p>
            <p className="text-navy-900 font-bold">
              Blood Type: <span className="font-normal">{activeProfile?.bloodType || "Not recorded"}</span>
            </p>
            <p className="text-navy-900 font-bold">
              Primary Clinic:{" "}
              <span className="font-normal">
                {activeProfile?.primaryDoctor.clinic} ({activeProfile?.primaryDoctor.phone})
              </span>
            </p>
            {activeProfile?.primaryConditionNotes && (
              <p className="text-navy-900 font-bold">
                Clinical Summary:{" "}
                <span className="font-normal text-navy-700">{activeProfile.primaryConditionNotes}</span>
              </p>
            )}
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => setEmergencyModalOpen(false)}
            className="w-full text-base font-bold"
          >
            Close Emergency View
          </Button>
        </div>
      </Dialog>
    </>
  );
}
