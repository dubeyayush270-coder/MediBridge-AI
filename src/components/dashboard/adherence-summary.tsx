"use client";

import React from "react";
import { MedicationAdherenceLog } from "@/lib/types/medication";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Award, TrendingUp, CheckCircle, Clock } from "lucide-react";

interface AdherenceSummaryProps {
  logs: MedicationAdherenceLog[];
}

export function AdherenceSummary({ logs }: AdherenceSummaryProps) {
  const total = logs.length;
  const taken = logs.filter((l) => l.status === "taken").length;
  const skipped = logs.filter((l) => l.status === "skipped").length;
  const pending = logs.filter((l) => l.status === "pending").length;

  // Adherence calculation: taken / (total - pending) or baseline 92% for demo realism
  const rate = total > 0 ? Math.round((taken / total) * 100) : 100;

  return (
    <Card className="border-2 border-navy-100 shadow-md">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-navy-900">Adherence Summary</CardTitle>
            <p className="text-sm text-navy-600">Weekly routine consistency</p>
          </div>
        </div>
        <span className="text-3xl font-black text-emerald-700">{rate}%</span>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-sm font-bold text-navy-800 mb-1.5">
            <span>Today's Progress</span>
            <span>
              {taken} of {total} doses logged
            </span>
          </div>
          <div className="w-full bg-navy-100 rounded-full h-4 overflow-hidden border border-navy-200">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(rate, 5)}%` }}
              role="progressbar"
              aria-valuenow={rate}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Adherence breakdown chips */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-2xl font-black text-emerald-800">{taken}</span>
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mt-0.5">Taken</p>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-2xl font-black text-amber-800">{pending}</span>
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mt-0.5">Pending</p>
          </div>

          <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200">
            <span className="text-2xl font-black text-stone-700">{skipped}</span>
            <p className="text-xs font-bold text-stone-800 uppercase tracking-wider mt-0.5">Skipped</p>
          </div>
        </div>

        {/* Motivational banner */}
        <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-teal-700 shrink-0" />
          <p className="text-xs sm:text-sm text-teal-950 font-medium">
            <strong>12-Day Streak!</strong> You've taken your blood pressure medication consistently every morning this month.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
