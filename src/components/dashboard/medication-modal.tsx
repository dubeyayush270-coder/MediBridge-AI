"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Medication, MedicationFrequency, MedicationScheduleTime } from "@/lib/types/medication";
import { Pill, Clock, Plus, Trash, AlertCircle, Utensils, Check } from "lucide-react";

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medData: Partial<Medication>) => Promise<void>;
  initialData?: Medication | null;
}

const FREQUENCY_OPTIONS: {
  value: MedicationFrequency;
  label: string;
  defaultTimes: MedicationScheduleTime[];
}[] = [
  {
    value: "daily",
    label: "Once Daily (Morning)",
    defaultTimes: [{ time: "08:00", label: "morning" }],
  },
  {
    value: "twice_daily",
    label: "Twice Daily (Morning & Evening)",
    defaultTimes: [
      { time: "08:00", label: "morning" },
      { time: "20:00", label: "evening" },
    ],
  },
  {
    value: "three_times_daily",
    label: "Three Times Daily (Meals)",
    defaultTimes: [
      { time: "08:00", label: "morning" },
      { time: "12:00", label: "noon" },
      { time: "19:00", label: "evening" },
    ],
  },
  {
    value: "as_needed",
    label: "As Needed (PRN)",
    defaultTimes: [{ time: "12:00", label: "custom" }],
  },
];

const PILL_COLORS = ["White", "Yellow", "Pink", "Blue", "Orange", "Red", "Green", "Purple"];
const PILL_SHAPES = ["Round", "Oval", "Capsule", "Oblong", "Diamond"];

export function MedicationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: MedicationModalProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState<MedicationFrequency>("daily");
  const [scheduleTimes, setScheduleTimes] = useState<MedicationScheduleTime[]>([
    { time: "08:00", label: "morning" },
  ]);
  const [withFood, setWithFood] = useState<boolean>(true);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [prescribingDoctor, setPrescribingDoctor] = useState("");
  const [prescribedFor, setPrescribedFor] = useState("");
  const [pillColor, setPillColor] = useState("White");
  const [pillShape, setPillShape] = useState("Round");
  const [refillEnabled, setRefillEnabled] = useState(false);
  const [remainingDoses, setRemainingDoses] = useState<number>(30);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setGenericName(initialData.genericName || "");
      setDosage(initialData.dosage || "");
      setFrequency(initialData.frequency || "daily");
      setScheduleTimes(
        initialData.scheduleTimes && initialData.scheduleTimes.length > 0
          ? initialData.scheduleTimes
          : [{ time: "08:00", label: "morning" }]
      );
      setWithFood(initialData.withFood !== undefined ? initialData.withFood : true);
      setSpecialInstructions(initialData.specialInstructions || "");
      setPrescribingDoctor(initialData.prescribingDoctor || "");
      setPrescribedFor(initialData.prescribedFor || "");
      setPillColor(initialData.pillVisual?.color || "White");
      setPillShape(initialData.pillVisual?.shape || "Round");
      setRefillEnabled(Boolean(initialData.refillReminder?.enabled));
      setRemainingDoses(initialData.refillReminder?.remainingDoses || 30);
    } else {
      setName("");
      setGenericName("");
      setDosage("");
      setFrequency("daily");
      setScheduleTimes([{ time: "08:00", label: "morning" }]);
      setWithFood(true);
      setSpecialInstructions("");
      setPrescribingDoctor("");
      setPrescribedFor("");
      setPillColor("White");
      setPillShape("Round");
      setRefillEnabled(false);
      setRemainingDoses(30);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleFrequencyChange = (newFreq: MedicationFrequency) => {
    setFrequency(newFreq);
    const opt = FREQUENCY_OPTIONS.find((o) => o.value === newFreq);
    if (opt) {
      setScheduleTimes(opt.defaultTimes);
    }
  };

  const handleAddTime = () => {
    setScheduleTimes((prev) => [...prev, { time: "12:00", label: "custom" }]);
  };

  const handleRemoveTime = (index: number) => {
    if (scheduleTimes.length <= 1) return;
    setScheduleTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, newTime: string) => {
    setScheduleTimes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], time: newTime };
      return copy;
    });
  };

  const handleLabelChange = (
    index: number,
    newLabel: "morning" | "noon" | "evening" | "bedtime" | "custom"
  ) => {
    setScheduleTimes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], label: newLabel };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the medication name (e.g., Lisinopril).");
      return;
    }
    if (!dosage.trim()) {
      setError("Please specify the prescribed dosage (e.g., 20mg or 1 tablet).");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: Partial<Medication> = {
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        dosage: dosage.trim(),
        frequency,
        scheduleTimes,
        withFood,
        specialInstructions: specialInstructions.trim() || undefined,
        prescribingDoctor: prescribingDoctor.trim() || undefined,
        prescribedFor: prescribedFor.trim() || undefined,
        status: "active",
        pillVisual: {
          color: pillColor,
          shape: pillShape,
        },
        refillReminder: {
          enabled: refillEnabled,
          remainingDoses: refillEnabled ? Number(remainingDoses) : undefined,
        },
      };

      if (initialData?.id) {
        payload.id = initialData.id;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save medication. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Medication Regimen" : "Add New Prescribed Medication"}
      description="Record doctor's prescribed dosage, daily schedule, and instructions"
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-center gap-3 text-red-900 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Medication Name & Dosage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-bold text-navy-900 mb-1">
              Medication Name <span className="text-red-600">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lisinopril, Metformin"
              className="text-lg py-3"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-navy-900 mb-1">
              Dosage & Strength <span className="text-red-600">*</span>
            </label>
            <Input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 20mg, 1 tablet, 500mg"
              className="text-lg py-3"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-navy-800 mb-1">
              Generic / Chemical Name (Optional)
            </label>
            <Input
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              placeholder="e.g. Lisinopril dihydrate"
              className="text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-navy-800 mb-1">
              Prescribed For / Condition
            </label>
            <Input
              value={prescribedFor}
              onChange={(e) => setPrescribedFor(e.target.value)}
              placeholder="e.g. Blood pressure, Heart health"
              className="text-base"
            />
          </div>
        </div>

        {/* Section 2: Frequency & Scheduled Times */}
        <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border-2 border-stone-200">
          <label className="block text-base font-bold text-navy-900">
            Dosing Frequency & Routine
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => handleFrequencyChange(opt.value)}
                className={`p-3 rounded-xl border-2 text-left font-bold transition flex items-center justify-between ${
                  frequency === opt.value
                    ? "bg-teal-50 border-teal-600 text-teal-950"
                    : "bg-white border-stone-200 text-navy-800 hover:border-teal-300"
                }`}
              >
                <span className="text-sm">{opt.label}</span>
                {frequency === opt.value && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-700">
                Scheduled Daily Dose Times:
              </span>
              <button
                type="button"
                onClick={handleAddTime}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Time Slot</span>
              </button>
            </div>

            <div className="space-y-2">
              {scheduleTimes.map((st, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative w-36">
                    <Clock className="w-4 h-4 text-teal-700 absolute left-3 top-3.5" />
                    <input
                      type="time"
                      value={st.time}
                      onChange={(e) => handleTimeChange(idx, e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-base font-bold text-navy-900 bg-white border-2 border-stone-300 rounded-xl focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <select
                    value={st.label}
                    onChange={(e) =>
                      handleLabelChange(
                        idx,
                        e.target.value as "morning" | "noon" | "evening" | "bedtime" | "custom"
                      )
                    }
                    className="flex-1 px-3 py-2 text-sm font-semibold text-navy-900 bg-white border-2 border-stone-300 rounded-xl focus:border-teal-600 focus:outline-none"
                  >
                    <option value="morning">Morning</option>
                    <option value="noon">Noon / Lunch</option>
                    <option value="evening">Evening / Dinner</option>
                    <option value="bedtime">Bedtime</option>
                    <option value="custom">Custom Time</option>
                  </select>
                  {scheduleTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(idx)}
                      className="p-2 text-stone-400 hover:text-red-600 transition"
                      aria-label="Remove time"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Food Interaction & Instructions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-teal-50/70 border-2 border-teal-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 text-white rounded-xl">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="text-base font-bold text-navy-900">Food Requirement</p>
                <p className="text-xs text-navy-600">
                  {withFood ? "Take with or right after food" : "Safe to take on an empty stomach"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWithFood(true)}
                className={`px-3 py-1.5 rounded-xl font-bold text-sm border-2 transition ${
                  withFood
                    ? "bg-teal-700 text-white border-teal-800"
                    : "bg-white text-navy-700 border-stone-200"
                }`}
              >
                With Food
              </button>
              <button
                type="button"
                onClick={() => setWithFood(false)}
                className={`px-3 py-1.5 rounded-xl font-bold text-sm border-2 transition ${
                  !withFood
                    ? "bg-teal-700 text-white border-teal-800"
                    : "bg-white text-navy-700 border-stone-200"
                }`}
              >
                Anytime
              </button>
            </div>
          </div>

          <div>
            <label className="block text-base font-bold text-navy-900 mb-1">
              Special Doctor's Instructions
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Drink a full glass of water. Avoid grapefruit juice while taking this medication."
              className="w-full p-3 text-base text-navy-900 bg-white border-2 border-stone-300 rounded-2xl focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 4: Pill Visual Identification (Elder-friendly) */}
        <div className="p-4 bg-navy-50/60 rounded-2xl border-2 border-navy-100 space-y-3">
          <p className="text-sm font-bold text-navy-900 flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-700" />
            <span>Pill Appearance for Visual Recognition</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-700 mb-1">Pill Color</label>
              <select
                value={pillColor}
                onChange={(e) => setPillColor(e.target.value)}
                className="w-full p-2.5 bg-white border-2 border-navy-200 rounded-xl text-sm font-bold text-navy-900"
              >
                {PILL_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-navy-700 mb-1">Pill Shape</label>
              <select
                value={pillShape}
                onChange={(e) => setPillShape(e.target.value)}
                className="w-full p-2.5 bg-white border-2 border-navy-200 rounded-xl text-sm font-bold text-navy-900"
              >
                {PILL_SHAPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Clinician & Refill */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-navy-800 mb-1">
              Prescribing Clinician
            </label>
            <Input
              value={prescribingDoctor}
              onChange={(e) => setPrescribingDoctor(e.target.value)}
              placeholder="e.g. Dr. Robert Chen, MD"
              className="text-base"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-bold text-navy-800">Refill Tracking</label>
              <button
                type="button"
                onClick={() => setRefillEnabled(!refillEnabled)}
                className="text-xs font-bold text-teal-700 hover:underline"
              >
                {refillEnabled ? "Disable" : "Enable"}
              </button>
            </div>
            {refillEnabled ? (
              <Input
                type="number"
                value={remainingDoses}
                onChange={(e) => setRemainingDoses(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Remaining doses"
                className="text-base"
              />
            ) : (
              <p className="text-xs text-navy-500 py-2">Tracking disabled</p>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
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
            {loading ? "Saving..." : isEditing ? "Save Medication Changes" : "Add Medication to Regimen"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
