"use client";

import React from "react";
import { CareProfileMembership } from "@/lib/types/membership";
import { CareProfile } from "@/lib/types/care-profile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Phone, ShieldCheck, UserPlus, HeartHandshake, Key } from "lucide-react";

interface CaregiverTeamProps {
  memberships: CareProfileMembership[];
  activeProfile: CareProfile | null;
  onOpenInviteModal: () => void;
}

export function CaregiverTeam({
  memberships,
  activeProfile,
  onOpenInviteModal,
}: CaregiverTeamProps) {
  return (
    <Card className="border-2 border-navy-100 shadow-md">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-navy-900">Care Team & Family</CardTitle>
            <p className="text-sm text-navy-600">Connected circle of care</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenInviteModal}
          className="text-xs font-bold border-teal-600 text-teal-800 hover:bg-teal-50 flex items-center gap-1"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite</span>
        </Button>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {memberships.length === 0 ? (
          <p className="text-sm text-navy-500 text-center py-4">No caregivers connected yet.</p>
        ) : (
          memberships.map((member) => {
            const isSelf = member.relationshipToPatient === "Self";
            return (
              <div
                key={member.id}
                className="p-3.5 rounded-xl border border-navy-100 bg-navy-50/40 hover:bg-white hover:border-teal-200 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 border border-teal-200">
                    {member.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-base font-bold text-navy-900 leading-tight">
                        {member.userName}
                      </p>
                      {isSelf && (
                        <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                          Patient
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-navy-600">
                      {member.relationshipToPatient} •{" "}
                      <span className="capitalize">{member.role.replace("_", " ")}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                </div>
              </div>
            );
          })
        )}

        {/* Emergency contact quick link */}
        {activeProfile?.emergencyContacts?.[0] && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-red-950 uppercase tracking-wider block">
                Primary Emergency Contact
              </span>
              <span className="text-red-900 font-bold text-sm">
                {activeProfile.emergencyContacts[0].name} ({activeProfile.emergencyContacts[0].relationship})
              </span>
            </div>
            <a
              href={`tel:${activeProfile.emergencyContacts[0].phone}`}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              aria-label={`Call emergency contact ${activeProfile.emergencyContacts[0].name}`}
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
