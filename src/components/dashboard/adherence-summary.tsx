"use client";

import React from "react";
import { Medication, MedicationAdherenceLog } from "@/lib/types/medication";
import { calculateAdherenceStats } from "@/lib/utils/adherence";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Award, TrendingUp, CheckCircle2, Clock, Sparkles } from "lucide-react";

interface AdherenceSummaryProps {
  logs: MedicationAdherenceLog[];
  medications?: Medication[];
}

export function AdherenceSummary({ logs, medications = [] }: AdherenceSummaryProps) {
  const stats = calculateAdherenceStats(medications, logs);

  return (
    <Card className="border-2 border-navy-100 shadow-md">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-navy-900">Adherence Summary</CardTitle>
            <p className="text-sm text-navy-600">Daily routine & weekly consistency</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-emerald-700">{stats.todayRate}%</span>
          <p className="text-xs text-navy-500 font-bold">Today</p>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-sm font-bold text-navy-800 mb-1.5">
            <span>Today's Completion</span>
            <span>
              {stats.todayTaken} of {stats.todayTotal} doses taken
            </span>
          </div>
          <div className="w-full bg-navy-100 rounded-full h-4 overflow-hidden border border-navy-200">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(stats.todayRate, stats.todayTotal === 0 ? 0 : 5)}%` }}
              role="progressbar"
              aria-valuenow={stats.todayRate}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Adherence breakdown chips */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-xl font-black text-emerald-800">{stats.todayTaken}</span>
            <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mt-0.5">Taken</p>
          </div>

          <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-xl font-black text-amber-800">{stats.todayPending}</span>
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mt-0.5">Pending</p>
          </div>

          <div className="p-2 bg-stone-100 rounded-xl border border-stone-200">
            <span className="text-xl font-black text-stone-700">{stats.todaySkipped}</span>
            <p className="text-[11px] font-bold text-stone-800 uppercase tracking-wider mt-0.5">Skipped</p>
          </div>

          <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-xl font-black text-rose-700">{stats.todayMissed}</span>
            <p className="text-[11px] font-bold text-rose-900 uppercase tracking-wider mt-0.5">Missed</p>
          </div>
        </div>

        {/* Weekly Stats & Streak Banner */}
        <div className="p-4 bg-teal-50 rounded-2xl border-2 border-teal-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-teal-700" />
              7-Day Adherence Rate
            </span>
            <span className="text-lg font-black text-teal-900">{stats.weeklyRate}%</span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-teal-200/60">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs sm:text-sm text-teal-950 font-medium">
              <strong>{stats.streakDays}-Day Streak!</strong>{" "}
              {stats.streakDays > 0
                ? "Excellent consistency following your daily medical plan."
                : "Log today's doses on time to start building your streak."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
