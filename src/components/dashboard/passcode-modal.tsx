"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CareProfile } from "@/lib/types/care-profile";
import { Key, ShieldCheck, Copy, Check, AlertCircle, Clock } from "lucide-react";

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: CareProfile | null;
  onJoinWithPasscode: (profileId: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
}

export function PasscodeModal({
  isOpen,
  onClose,
  activeProfile,
  onJoinWithPasscode,
}: PasscodeModalProps) {
  const [tab, setTab] = useState<"join" | "invite">("join");
  const [targetProfileId, setTargetProfileId] = useState("");
  const [inputPasscode, setInputPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Demo active invite passcode for Eleanor Vance
  const demoSharePasscode = "CARE26";

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!targetProfileId.trim()) {
      setErrorMessage("Please enter the Care Profile ID.");
      return;
    }
    if (!inputPasscode.trim()) {
      setErrorMessage("Please enter the 6-character access passcode.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onJoinWithPasscode(targetProfileId.trim(), inputPasscode.trim());
      if (res.success) {
        setSuccessMessage("Successfully linked to the care profile!");
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
          setInputPasscode("");
        }, 1800);
      } else {
        setErrorMessage(res.error || "Invalid passcode or profile ID.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error joining profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Secure Profile Linking & Access"
      description="Connect family members and caregivers using encrypted passcodes"
    >
      {/* Tabs */}
      <div className="flex border-b border-navy-100 mb-6">
        <button
          onClick={() => {
            setTab("join");
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-3 text-base font-bold border-b-2 text-center transition ${
            tab === "join"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-navy-500 hover:text-navy-900"
          }`}
        >
          Join a Profile
        </button>
        <button
          onClick={() => {
            setTab("invite");
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-3 text-base font-bold border-b-2 text-center transition ${
            tab === "invite"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-navy-500 hover:text-navy-900"
          }`}
        >
          Share Access Code
        </button>
      </div>

      {tab === "join" ? (
        <form onSubmit={handleJoin} className="space-y-4">
          <p className="text-sm text-navy-700">
            If a family member or patient shared an access code with you, enter it below to securely link their care dashboard to your account.
          </p>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-sm text-red-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-sm text-emerald-900 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <Input
            label="Care Profile ID *"
            value={targetProfileId}
            onChange={(e) => setTargetProfileId(e.target.value)}
            placeholder="e.g. profile-vance-76"
            helperText="Provided by the patient or primary caregiver"
            required
          />

          <Input
            label="6-Character Access Passcode *"
            value={inputPasscode}
            onChange={(e) => setInputPasscode(e.target.value.toUpperCase())}
            placeholder="e.g. CARE26"
            className="uppercase tracking-widest font-mono text-xl"
            maxLength={8}
            required
          />

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900">
            <strong>Hackathon Demo Note:</strong> To test linking, you can use Profile ID:{" "}
            <code className="font-bold bg-teal-100 px-1 py-0.5 rounded">profile-vance-76</code> and Passcode:{" "}
            <code className="font-bold bg-teal-100 px-1 py-0.5 rounded">CARE26</code>.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
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
              Verify & Link Profile
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-navy-700">
            Share this secure code with your family member or nurse. Once they enter it, they can view daily medications and appointments.
          </p>

          <div className="p-5 bg-navy-50 rounded-2xl border-2 border-teal-200 space-y-3 text-center">
            <span className="text-xs font-bold text-navy-600 uppercase tracking-wider block">
              Active Passcode for {activeProfile?.patientName || "Current Profile"}
            </span>

            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl sm:text-4xl font-black text-teal-800 tracking-widest bg-white px-6 py-2.5 rounded-xl border-2 border-teal-300 shadow-sm">
                {demoSharePasscode}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(demoSharePasscode)}
                className="p-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition shadow-sm"
                title="Copy passcode"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-200" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-navy-600 pt-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Valid for 48 hours • Single use per caregiver</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Security Protocol:</strong> In accordance with our safety architecture, passcodes are hashed with SHA-256 and salt before verification. Only share with verified individuals.
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="w-full text-base font-bold"
          >
            Done
          </Button>
        </div>
      )}
    </Dialog>
  );
}
