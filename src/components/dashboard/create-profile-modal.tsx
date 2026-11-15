"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CareProfile } from "@/lib/types/care-profile";
import { Heart, User, Calendar, Phone, Stethoscope, AlertTriangle } from "lucide-react";

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProfile: (data: Partial<CareProfile>) => Promise<CareProfile>;
}

export function CreateProfileModal({
  isOpen,
  onClose,
  onCreateProfile,
}: CreateProfileModalProps) {
  const [patientName, setPatientName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("1952-06-15");
  const [doctorName, setDoctorName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError("Please enter the patient's full legal name.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const allergies = allergiesInput
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      await onCreateProfile({
        patientName: patientName.trim(),
        preferredName: preferredName.trim() || patientName.split(" ")[0],
        dateOfBirth,
        primaryConditionNotes: conditionNotes.trim() || "General routine care.",
        allergies,
        primaryDoctor: {
          name: doctorName.trim() || "Dr. Medical Provider, MD",
          clinic: clinicName.trim() || "Community Health Center",
          phone: doctorPhone.trim() || "(555) 000-0000",
        },
        emergencyContacts: emergencyName
          ? [
              {
                name: emergencyName.trim(),
                relationship: "Family / Emergency",
                phone: emergencyPhone.trim() || "(555) 000-0000",
                isPrimary: true,
              },
            ]
          : [],
      });

      onClose();
      // Reset form
      setPatientName("");
      setPreferredName("");
      setAllergiesInput("");
      setConditionNotes("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Elderly Care Profile"
      description="Set up a centralized, accessible profile for an elderly parent or patient"
      className="max-w-xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-sm text-red-800 font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Patient Full Legal Name *"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Arthur Pendelton"
            required
          />
          <Input
            label="Preferred First Name"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="e.g. Art"
          />
        </div>

        <Input
          label="Date of Birth *"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
        />

        <div className="pt-2 border-t border-navy-100">
          <h4 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-teal-700" />
            Primary Care Physician
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Doctor Name"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Laura Miller, MD"
            />
            <Input
              label="Clinic / Practice Phone"
              value={doctorPhone}
              onChange={(e) => setDoctorPhone(e.target.value)}
              placeholder="(555) 234-5678"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-navy-100">
          <h4 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            Known Allergies & Conditions
          </h4>
          <Input
            label="Known Allergies (comma-separated)"
            value={allergiesInput}
            onChange={(e) => setAllergiesInput(e.target.value)}
            placeholder="e.g. Penicillin, Aspirin, Shellfish"
          />
        </div>

        <div className="pt-2 border-t border-navy-100">
          <h4 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-red-700" />
            Primary Emergency Contact
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Name & Relationship"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="e.g. David Pendelton (Son)"
            />
            <Input
              label="Contact Phone"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="(555) 987-6543"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-100">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="bg-teal-700 hover:bg-teal-800"
          >
            Create Care Profile
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
