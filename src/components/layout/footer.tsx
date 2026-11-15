import React from "react";
import Link from "next/link";
import { Heart, Shield, AlertTriangle, PhoneCall } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-950 text-white mt-16 border-t border-navy-800">
      {/* Emergency Notice Banner */}
      <div className="bg-red-950/80 border-b border-red-900/60 py-3 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-red-200">
          <PhoneCall className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            Medical Emergency Notice: If you or your loved one are experiencing a life-threatening medical emergency, call <strong>911</strong> or go to the nearest emergency room immediately.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Vision */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white">
                <Heart className="w-5 h-5 fill-white/20 stroke-white stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black tracking-tight">
                MediBridge<span className="text-teal-400">AI</span>
              </span>
            </div>
            <p className="text-navy-300 text-base max-w-md">
              From Doctor&apos;s Advice to Everyday Care. An accessible, AI-powered healthcare companion connecting seniors, their families, and dedicated caregivers.
            </p>
            <div className="flex items-center gap-2 text-xs text-navy-400 pt-2">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Built for Catalyst 2026 PromptWars | Google Cloud Run & Firebase Architecture</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-bold text-white uppercase tracking-wider mb-3">
              Care Portal
            </h4>
            <ul className="space-y-2 text-sm text-navy-300">
              <li>
                <Link href="/dashboard" className="hover:text-teal-300 transition">
                  Patient Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/medications" className="hover:text-teal-300 transition">
                  Medication Schedules
                </Link>
              </li>
              <li>
                <Link href="/dashboard/appointments" className="hover:text-teal-300 transition">
                  Upcoming Consultations
                </Link>
              </li>
              <li>
                <Link href="/dashboard/care-team" className="hover:text-teal-300 transition">
                  Family & Caregiver Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinical Safety Disclaimer */}
          <div>
            <h4 className="text-base font-bold text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Clinical Disclaimer</span>
            </h4>
            <p className="text-xs leading-relaxed text-navy-300">
              MediBridge AI provides tools for medication adherence, schedule tracking, and family coordination. It does not provide medical diagnoses or alter prescribed medical regimens. All medical advice and treatment decisions must come from qualified medical clinicians.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-navy-800 text-center text-xs text-navy-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MediBridge AI. All rights reserved. Demo patient data is entirely fictional.</p>
          <div className="flex items-center gap-4">
            <span className="text-teal-400 font-medium">HIPAA-conscious Architecture</span>
            <span>•</span>
            <span className="text-navy-300">Passcode Protected Sharing</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
