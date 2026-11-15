"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PasscodeModal } from "@/components/dashboard/passcode-modal";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Phone,
  ArrowLeft,
  Key,
  ShieldAlert,
} from "lucide-react";

export default function CareTeamPage() {
  const { memberships, activeProfile, joinProfileWithPasscode } = useAuth();
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false);

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
            Family & Care Circle
          </h1>
          <p className="text-base text-navy-600 mt-1">
            Authorized caregivers, family coordinators, and emergency contacts
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setPasscodeModalOpen(true)}
          className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800"
        >
          <UserPlus className="w-5 h-5" />
          <span>Invite / Link Caregiver</span>
        </Button>
      </div>

      {/* Security explanation card */}
      <Card className="bg-teal-50/70 border-2 border-teal-200">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-sm text-teal-950 space-y-1">
            <h4 className="font-bold text-base">Passcode-Secured Care Collaboration</h4>
            <p>
              In MediBridge AI, care profiles use cryptographic salted SHA-256 passcodes for linking caregivers and relatives. Caregivers can view schedules and log doses without accessing administrative billing or credentials.
            </p>
          </div>
        </div>
      </Card>

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {memberships.map((member) => (
          <Card key={member.id} className="border-2 border-navy-100 shadow-md">
            <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-bold text-lg flex items-center justify-center">
                  {member.userName.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-xl text-navy-900">{member.userName}</CardTitle>
                  <p className="text-xs text-navy-600 font-medium">
                    {member.relationshipToPatient} •{" "}
                    <span className="capitalize font-bold text-teal-800">
                      {member.role.replace("_", " ")}
                    </span>
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                Active
              </Badge>
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-navy-600">
                Email: <span className="font-medium text-navy-900">{member.userEmail}</span>
              </p>

              <div>
                <span className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-1">
                  Granted Clinical Permissions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {member.permissions.map((perm, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold bg-navy-50 text-navy-800 px-2 py-0.5 rounded-md border border-navy-200"
                    >
                      {perm.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-navy-400 pt-2 border-t border-navy-100">
                Member joined on {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency contacts card */}
      <Card className="border-2 border-red-200 bg-red-50/40">
        <CardHeader className="pb-3 border-b border-red-200 flex flex-row items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          <CardTitle className="text-xl text-red-950">Emergency Contact Protocols</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {activeProfile?.emergencyContacts?.map((c, i) => (
            <div
              key={i}
              className="p-3 bg-white rounded-xl border border-red-200 flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-navy-900">
                  {c.name} ({c.relationship})
                </p>
                <p className="text-xs text-navy-600">Designated Primary Emergency Contact</p>
              </div>
              <a
                href={`tel:${c.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {c.phone}</span>
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      <PasscodeModal
        isOpen={passcodeModalOpen}
        onClose={() => setPasscodeModalOpen(false)}
        activeProfile={activeProfile}
        onJoinWithPasscode={joinProfileWithPasscode}
      />
    </div>
  );
}
