import React from "react";
import Link from "next/link";
import {
  Heart,
  Pill,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  PhoneCall,
  Lock,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-12">
      {/* Hero Section */}
      <section className="pt-6 sm:pt-12 pb-8 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-900 border border-teal-200 text-sm font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-teal-700" />
          <span>Built for Catalyst 2026 PromptWars</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-navy-900 tracking-tight leading-[1.15]">
          From Doctor&apos;s Advice to{" "}
          <span className="text-teal-700 underline decoration-teal-300 decoration-4 underline-offset-8">
            Everyday Care.
          </span>
        </h1>

        <p className="text-xl sm:text-2xl text-navy-700 max-w-3xl mx-auto font-medium leading-relaxed">
          MediBridge AI is an accessible healthcare companion that helps older adults effortlessly adhere to medication schedules, keep up with appointments, and share vital updates with loved ones and caregivers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="elder-action"
              size="xl"
              className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center gap-3 shadow-lg"
            >
              <span>Explore Demo Dashboard</span>
              <ArrowRight className="w-6 h-6" />
            </Button>
          </Link>

          <Link href="/register" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="xl"
              className="w-full sm:w-auto border-2 border-navy-900 text-navy-900 hover:bg-navy-50 font-bold"
            >
              Create Account
            </Button>
          </Link>
        </div>

        {/* Reassurance points */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm sm:text-base font-bold text-navy-800">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-700" />
            Designed specifically for seniors
          </span>
          <span className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-700" />
            Passcode-secured family sharing
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            Zero clinical hallucinations
          </span>
        </div>
      </section>

      {/* High-Contrast Interactive Preview Card */}
      <section className="max-w-5xl mx-auto">
        <div className="p-6 sm:p-10 rounded-3xl bg-white border-2 border-navy-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-navy-100 gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Live Sample Dashboard
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-navy-900 mt-2">
                Designed for Clarity, Dignity, and Peace of Mind
              </h2>
            </div>
            <Link href="/dashboard">
              <Button variant="primary" size="md">
                Open Full View
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Med Preview */}
            <div className="p-5 rounded-2xl bg-teal-50/70 border-2 border-teal-200 space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-bold">
                <Pill className="w-5 h-5 text-teal-700" />
                <span>Today&apos;s Morning Dose</span>
              </div>
              <h3 className="text-xl font-black text-navy-900">Lisinopril 10 mg</h3>
              <p className="text-sm text-navy-700">Scheduled for 8:00 AM • Oral tablet with water</p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Taken at 8:05 AM
                </span>
              </div>
            </div>

            {/* Quick Appointment Preview */}
            <div className="p-5 rounded-2xl bg-navy-50/70 border-2 border-navy-200 space-y-3">
              <div className="flex items-center gap-2 text-navy-900 font-bold">
                <Calendar className="w-5 h-5 text-teal-700" />
                <span>Next Consultation</span>
              </div>
              <h3 className="text-xl font-black text-navy-900">Dr. Sarah Jenkins, MD</h3>
              <p className="text-sm text-navy-700">Thursday, Nov 19 at 10:30 AM</p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-800 text-white font-semibold text-xs">
                  Accompanied by Marcus (Son)
                </span>
              </div>
            </div>

            {/* Quick Caregiver Preview */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <Users className="w-5 h-5 text-amber-700" />
                <span>Care Circle</span>
              </div>
              <h3 className="text-xl font-black text-navy-900">3 Active Members</h3>
              <p className="text-sm text-navy-700">Son Marcus, Daughter Sarah, Visiting Nurse Maria</p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs">
                  Passcode Protected
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Hackathon Pillars */}
      <section className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-navy-900">
            Engineered Around Real Elder Healthcare Realities
          </h2>
          <p className="text-lg text-navy-600 max-w-2xl mx-auto font-medium">
            Bridging the gap between complex clinical discharge orders and daily adherence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card elevated className="space-y-4 p-8 border-2 border-teal-100">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Pill className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-navy-900">1. Smart Medication Schedules</h3>
            <p className="text-base text-navy-600 leading-relaxed">
              Clear schedules organized by morning, noon, evening, and bedtime. Large touch targets make logging doses painless for seniors with tremor or reduced vision.
            </p>
          </Card>

          <Card elevated className="space-y-4 p-8 border-2 border-teal-100">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-navy-900">2. Passcode-Based Caregiver Circles</h3>
            <p className="text-base text-navy-600 leading-relaxed">
              Grandparents don’t need to manage OAuth tokens. Instead, temporary salted SHA-256 passcodes let children and visiting nurses link accounts safely in seconds.
            </p>
          </Card>

          <Card elevated className="space-y-4 p-8 border-2 border-teal-100">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-navy-900">3. Appointment & Ride Coordination</h3>
            <p className="text-base text-navy-600 leading-relaxed">
              Track appointments with clinic addresses, questions to ask the doctor, and designated transportation companions so appointments are never missed.
            </p>
          </Card>
        </div>
      </section>

      {/* Accessibility Commitment */}
      <section className="bg-navy-900 text-white rounded-3xl p-8 sm:p-12 max-w-5xl mx-auto shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Eye className="w-8 h-8 text-teal-400" />
          <h2 className="text-2xl sm:text-3xl font-black">Elder-First Accessibility Standards</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-navy-200">
          <div className="p-4 bg-navy-800/80 rounded-2xl border border-navy-700">
            <h4 className="text-lg font-bold text-white mb-1">High-Contrast & Large Fonts</h4>
            <p className="text-sm">
              Deep navy text against off-white surfaces ensures maximum legibility for aging eyes without harsh visual glare.
            </p>
          </div>
          <div className="p-4 bg-navy-800/80 rounded-2xl border border-navy-700">
            <h4 className="text-lg font-bold text-white mb-1">56px+ Touch Targets</h4>
            <p className="text-sm">
              Generous button sizes and ample spacing eliminate accidental taps for users with arthritis or motor control challenges.
            </p>
          </div>
          <div className="p-4 bg-navy-800/80 rounded-2xl border border-navy-700">
            <h4 className="text-lg font-bold text-white mb-1">Multi-Channel Status</h4>
            <p className="text-sm">
              We never communicate health status via color alone; status is always paired with icons and explicit written confirmation.
            </p>
          </div>
          <div className="p-4 bg-navy-800/80 rounded-2xl border border-navy-700">
            <h4 className="text-lg font-bold text-white mb-1">Printable Physical Sheets</h4>
            <p className="text-sm">
              One-click printing produces an optimized daily medication sheet ready to magnet onto the refrigerator.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="text-center max-w-3xl mx-auto space-y-6 py-6">
        <h2 className="text-3xl sm:text-4xl font-black text-navy-900">
          Ready to experience MediBridge AI?
        </h2>
        <p className="text-lg text-navy-600 font-medium">
          Start exploring with our realistic demonstration profile or register a new care profile today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="elder-action" size="lg" className="w-full sm:w-auto">
              Launch Patient Dashboard
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-navy-900">
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
