"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Appointment } from "@/lib/types/appointment";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  UserCheck,
  Plus,
  Trash,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (aptData: Partial<Appointment>) => Promise<void>;
  initialData?: Appointment | null;
  availableCompanions?: { name: string; role: string }[];
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableCompanions = [],
}: AppointmentModalProps) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [purpose, setPurpose] = useState("");
  const [preparationNotes, setPreparationNotes] = useState("");
  const [transportAssistance, setTransportAssistance] = useState(false);
  const [companionName, setCompanionName] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestionInput, setNewQuestionInput] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDoctorName(initialData.doctorName || "");
      setSpecialty(initialData.specialty || "");
      setClinicName(initialData.clinicName || "");
      setAddress(initialData.address || "");
      setPhone(initialData.phone || "");

      if (initialData.dateTime) {
        const dt = new Date(initialData.dateTime);
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const dd = String(dt.getDate()).padStart(2, "0");
        setDate(`${yyyy}-${mm}-${dd}`);
        const hours = String(dt.getHours()).padStart(2, "0");
        const mins = String(dt.getMinutes()).padStart(2, "0");
        setTime(`${hours}:${mins}`);
      } else {
        setDate(new Date().toISOString().split("T")[0]);
        setTime("09:00");
      }

      setDurationMinutes(initialData.durationMinutes || 30);
      setPurpose(initialData.purpose || "");
      setPreparationNotes(initialData.preparationNotes || "");
      setTransportAssistance(Boolean(initialData.transportAssistanceNeeded));
      setCompanionName(initialData.assignedCompanion?.userName || "");
      setQuestions(initialData.questionsToAsk || []);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");

      setTitle("");
      setDoctorName("");
      setSpecialty("");
      setClinicName("");
      setAddress("");
      setPhone("");
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime("10:00");
      setDurationMinutes(30);
      setPurpose("");
      setPreparationNotes("");
      setTransportAssistance(false);
      setCompanionName("");
      setQuestions([]);
    }
    setNewQuestionInput("");
    setError(null);
  }, [initialData, isOpen]);

  const handleAddQuestion = () => {
    if (!newQuestionInput.trim()) return;
    setQuestions((prev) => [...prev, newQuestionInput.trim()]);
    setNewQuestionInput("");
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for this appointment (e.g., Cardiology Follow-up).");
      return;
    }
    if (!doctorName.trim()) {
      setError("Please provide the doctor or specialist's name.");
      return;
    }
    if (!date) {
      setError("Please select the appointment date.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construct timezone-aware ISO string
      const isoDateTime = new Date(`${date}T${time || "09:00"}:00`).toISOString();

      const payload: Partial<Appointment> = {
        title: title.trim(),
        doctorName: doctorName.trim(),
        specialty: specialty.trim() || "General Practice",
        clinicName: clinicName.trim() || "Medical Clinic",
        address: address.trim(),
        phone: phone.trim(),
        dateTime: isoDateTime,
        durationMinutes: Number(durationMinutes) || 30,
        status: "upcoming",
        purpose: purpose.trim() || "Consultation and routine follow-up",
        preparationNotes: preparationNotes.trim() || undefined,
        transportAssistanceNeeded: transportAssistance,
        questionsToAsk: questions,
        assignedCompanion: companionName.trim()
          ? {
              userId: "companion",
              userName: companionName.trim(),
            }
          : undefined,
      };

      if (initialData?.id) {
        payload.id = initialData.id;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to schedule appointment. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Medical Consultation" : "Schedule New Doctor Consultation"}
      description="Record appointment details, clinical questions, and companion escort"
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-center gap-3 text-red-900 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Title & Doctor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-bold text-navy-900 mb-1">
              Appointment Title <span className="text-red-600">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cardiology Checkup, Dental Exam"
              className="text-lg py-3"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-navy-900 mb-1">
              Doctor / Clinician Name <span className="text-red-600">*</span>
            </label>
            <Input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Robert Chen, MD"
              className="text-lg py-3"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-navy-800 mb-1">
              Medical Specialty
            </label>
            <Input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Cardiology, Neurology, Primary Care"
              className="text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-navy-800 mb-1">
              Contact Phone Number
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (555) 234-5678"
              className="text-base"
            />
          </div>
        </div>

        {/* Section 2: Date, Time, Duration */}
        <div className="p-4 bg-stone-50 rounded-2xl border-2 border-stone-200 space-y-3">
          <label className="block text-base font-bold text-navy-900">
            Appointment Date, Time & Duration
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold text-navy-900 bg-white border-2 border-stone-300 rounded-xl focus:border-teal-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-700 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-base font-bold text-navy-900 bg-white border-2 border-stone-300 rounded-xl focus:border-teal-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-700 mb-1">Duration (Minutes)</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-base font-bold text-navy-900 bg-white border-2 border-stone-300 rounded-xl focus:border-teal-600 focus:outline-none"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes (1 hour)</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-navy-800 mb-1">
              Clinic or Hospital Name
            </label>
            <Input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="e.g. Valley Medical Arts Building"
              className="text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-navy-800 mb-1">
              Clinic Address / Room Number
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 1200 Mercy Way, Suite 400"
              className="text-base"
            />
          </div>
        </div>

        {/* Section 4: Purpose & Preparation Notes */}
        <div className="space-y-4">
          <div>
            <label className="block text-base font-bold text-navy-900 mb-1">
              Consultation Purpose & Objectives
            </label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Review blood pressure readings and adjust dosage"
              className="text-base py-3"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-navy-900 mb-1">
              Preparation Instructions
            </label>
            <textarea
              rows={2}
              value={preparationNotes}
              onChange={(e) => setPreparationNotes(e.target.value)}
              placeholder="e.g. Fast 12 hours prior for blood lipid panel. Bring all current prescription bottles."
              className="w-full p-3 text-base text-navy-900 bg-white border-2 border-stone-300 rounded-2xl focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 5: Questions to Ask Doctor */}
        <div className="p-4 bg-navy-50/70 rounded-2xl border-2 border-navy-100 space-y-3">
          <label className="block text-sm font-bold text-navy-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-teal-700" />
            <span>Questions to Ask the Doctor During Visit</span>
          </label>

          <div className="flex gap-2">
            <Input
              value={newQuestionInput}
              onChange={(e) => setNewQuestionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddQuestion();
                }
              }}
              placeholder="e.g. Can we lower the dosage if my morning readings are steady?"
              className="text-sm bg-white"
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleAddQuestion}
              className="border-navy-300 text-navy-800 shrink-0 font-bold"
            >
              Add Question
            </Button>
          </div>

          {questions.length > 0 && (
            <div className="space-y-2 pt-1">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-navy-200 text-sm font-medium text-navy-900"
                >
                  <span className="flex-1 pr-2">
                    {idx + 1}. {q}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="p-1 text-stone-400 hover:text-red-600 transition"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 6: Companion Escort & Transport Assistance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-teal-50/60 rounded-2xl border-2 border-teal-200">
          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Assigned Companion Escort</span>
            </label>
            <Input
              value={companionName}
              onChange={(e) => setCompanionName(e.target.value)}
              placeholder="e.g. Marcus Vance (Son)"
              className="text-base bg-white"
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 pt-3">
              <input
                type="checkbox"
                id="transportNeeded"
                checked={transportAssistance}
                onChange={(e) => setTransportAssistance(e.target.checked)}
                className="w-5 h-5 text-teal-700 rounded border-2 border-navy-300 focus:ring-teal-500"
              />
              <label
                htmlFor="transportNeeded"
                className="text-sm font-bold text-navy-900 cursor-pointer"
              >
                Request Transport / Ride Assistance
              </label>
            </div>
            <p className="text-xs text-navy-600 pl-7 mt-0.5">
              Notifies family members that a ride or wheelchair escort is required.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-100">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onClose}
            disabled={loading}
            className="border-stone-300 text-navy-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 min-h-[52px]"
          >
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Confirm & Schedule Appointment"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
