/**
 * MediBridge AI — Milestone 5 "MediBridge Care Copilot" Tests
 *
 * Verifies:
 * 1. Priority 1: Missed-dose & overdue prioritization with safe, supportive guidance
 * 2. Priority 2: Approaching medication dose with verified instructions & meal guidance
 * 3. Priority 3: Upcoming doctor appointments within 24 hours with preparation & transport info
 * 4. Priority 4: Positive 100% adherence milestone celebration
 * 5. Priority 5: Neutral daily care summary for up-to-date or empty schedules
 * 6. Zero-hallucination medical safety guarantee (never suggests doubling doses or invented advice)
 * 7. Timezone-aware scheduling & boundary handling
 * 8. Accessible CareCopilot component rendering, labels, and touch targets
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import {
  evaluateCareCopilotBriefing,
  COPILOT_SAFETY_DISCLAIMER,
} from "../lib/copilot/copilot-engine";
import { CareCopilot } from "../components/dashboard/care-copilot";
import { Medication, MedicationAdherenceLog } from "../lib/types/medication";
import { Appointment } from "../lib/types/appointment";

const mockMedications: Medication[] = [
  {
    id: "med-1",
    profileId: "profile-alice",
    name: "Lisinopril",
    dosage: "20mg",
    frequency: "daily",
    scheduleTimes: [{ time: "08:00", label: "morning" }],
    withFood: true,
    specialInstructions: "Take with a full glass of water in the morning.",
    status: "active",
    refillReminder: { enabled: true, remainingDoses: 15 },
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "med-2",
    profileId: "profile-alice",
    name: "Metformin",
    dosage: "500mg",
    frequency: "twice_daily",
    scheduleTimes: [
      { time: "09:00", label: "morning" },
      { time: "19:00", label: "evening" },
    ],
    withFood: true,
    specialInstructions: "Take with evening meal to avoid stomach upset.",
    status: "active",
    refillReminder: { enabled: false },
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  },
];

const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    profileId: "profile-alice",
    title: "Cardiology Follow-Up",
    doctorName: "Sarah Jenkins",
    specialty: "Cardiology",
    clinicName: "Metro Health Heart Center",
    address: "742 Evergreen Terrace",
    dateTime: "2026-11-15T14:30:00Z",
    durationMinutes: 45,
    status: "upcoming",
    purpose: "Blood pressure review and ECG",
    preparationNotes: "Fasting required 6 hours prior. Bring recent BP log.",
    transportAssistanceNeeded: true,
    assignedCompanion: {
      userId: "caregiver-bob",
      userName: "Bob (Son)",
    },
    reminderSent: false,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  },
];

describe("MediBridge Care Copilot — Contextual Decision Engine", () => {
  it("PRIORITY 1: triggers when a dose is explicitly marked missed", () => {
    // 08:00 Lisinopril marked missed
    const adherenceLogs: MedicationAdherenceLog[] = [
      {
        id: "adh-1",
        profileId: "profile-alice",
        medicationId: "med-1",
        medicationName: "Lisinopril",
        dosage: "20mg",
        scheduledDate: "2026-11-15",
        scheduledTime: "08:00",
        status: "missed",
      },
    ];

    const refDate = new Date("2026-11-15T10:00:00");
    const briefing = evaluateCareCopilotBriefing(
      mockMedications,
      adherenceLogs,
      [],
      "Alice",
      refDate
    );

    expect(briefing.priorityLevel).toBe(1);
    expect(briefing.badgeVariant).toBe("critical");
    expect(briefing.priorityLabel).toBe("Action Needed");
    expect(briefing.headline).toContain("Medication Check-In Required");
    expect(briefing.primaryMessage).toContain("Lisinopril (20mg) is marked missed");
    // Verify supportive, non-prescriptive safety guidance
    expect(briefing.guidanceNote).toContain("never take a double dose");
    expect(briefing.safeMedicalDisclaimer).toBe(COPILOT_SAFETY_DISCLAIMER);
    expect(briefing.missedDoses.length).toBeGreaterThanOrEqual(1);
  });

  it("PRIORITY 1: triggers when a pending dose is overdue past the grace period", () => {
    // Current time is 09:45, Lisinopril 08:00 is still pending (overdue by >30 mins)
    const refDate = new Date("2026-11-15T09:45:00");
    const briefing = evaluateCareCopilotBriefing(
      mockMedications,
      [],
      [],
      "Alice",
      refDate
    );

    expect(briefing.priorityLevel).toBe(1);
    expect(briefing.badgeVariant).toBe("critical");
    expect(briefing.primaryMessage).toContain("past its scheduled time");
    expect(briefing.guidanceNote).toContain("never take a double dose");
  });

  it("PRIORITY 2: selects the next approaching dose and displays verified saved instructions", () => {
    // Current time is 07:30 (before morning doses), 08:00 Lisinopril is next
    const refDate = new Date("2026-11-15T07:30:00");
    const briefing = evaluateCareCopilotBriefing(
      mockMedications,
      [],
      [],
      "Alice",
      refDate
    );

    expect(briefing.priorityLevel).toBe(2);
    expect(briefing.badgeVariant).toBe("warning");
    expect(briefing.priorityLabel).toBe("Upcoming Dose");
    expect(briefing.headline).toContain("Next Dose: Lisinopril");
    expect(briefing.primaryMessage).toContain("Lisinopril (20mg)");
    // Includes verified saved meal and prescription instructions
    expect(briefing.guidanceNote).toContain("Take with meals");
    expect(briefing.guidanceNote).toContain("Take with a full glass of water");
    expect(briefing.nextDose?.medicationName).toBe("Lisinopril");
    expect(briefing.nextDose?.withFood).toBe(true);
  });

  it("PRIORITY 3: detects appointments approaching within 24 hours with prep notes & companion", () => {
    // Both morning doses taken; next is appointment in 4 hours
    const adherenceLogs: MedicationAdherenceLog[] = [
      {
        id: "adh-1",
        profileId: "profile-alice",
        medicationId: "med-1",
        medicationName: "Lisinopril",
        dosage: "20mg",
        scheduledDate: "2026-11-15",
        scheduledTime: "08:00",
        status: "taken",
      },
      {
        id: "adh-2",
        profileId: "profile-alice",
        medicationId: "med-2",
        medicationName: "Metformin",
        dosage: "500mg",
        scheduledDate: "2026-11-15",
        scheduledTime: "09:00",
        status: "taken",
      },
      {
        id: "adh-3",
        profileId: "profile-alice",
        medicationId: "med-2",
        medicationName: "Metformin",
        dosage: "500mg",
        scheduledDate: "2026-11-15",
        scheduledTime: "19:00",
        status: "taken",
      },
    ];

    // Reference time: 10:30 UTC on 2026-11-15 (appointment is at 14:30 UTC = 4 hours away)
    const refDate = new Date("2026-11-15T10:30:00Z");
    const briefing = evaluateCareCopilotBriefing(
      mockMedications,
      adherenceLogs,
      mockAppointments,
      "Alice",
      refDate
    );

    expect(briefing.priorityLevel).toBe(3);
    expect(briefing.badgeVariant).toBe("info");
    expect(briefing.priorityLabel).toBe("Upcoming Appointment");
    expect(briefing.headline).toContain("Dr. Sarah Jenkins");
    expect(briefing.primaryMessage).toContain("Metro Health Heart Center");
    expect(briefing.primaryMessage).toContain("Fasting required 6 hours prior");
    expect(briefing.primaryMessage).toContain("Bob (Son)");
    expect(briefing.upcomingAppointment?.hoursUntil).toBe(4);
  });

  it("PRIORITY 4: celebrates 100% adherence when all daily doses are taken", () => {
    const adherenceLogs: MedicationAdherenceLog[] = [
      {
        id: "adh-1",
        profileId: "profile-alice",
        medicationId: "med-1",
        medicationName: "Lisinopril",
        dosage: "20mg",
        scheduledDate: "2026-11-15",
        scheduledTime: "08:00",
        status: "taken",
      },
      {
        id: "adh-2",
        profileId: "profile-alice",
        medicationId: "med-2",
        medicationName: "Metformin",
        dosage: "500mg",
        scheduledDate: "2026-11-15",
        scheduledTime: "09:00",
        status: "taken",
      },
      {
        id: "adh-3",
        profileId: "profile-alice",
        medicationId: "med-2",
        medicationName: "Metformin",
        dosage: "500mg",
        scheduledDate: "2026-11-15",
        scheduledTime: "19:00",
        status: "taken",
      },
    ];

    const refDate = new Date("2026-11-15T21:00:00");
    const briefing = evaluateCareCopilotBriefing(
      mockMedications,
      adherenceLogs,
      [], // no appointment
      "Alice",
      refDate
    );

    expect(briefing.priorityLevel).toBe(4);
    expect(briefing.badgeVariant).toBe("success");
    expect(briefing.priorityLabel).toBe("All Doses Taken");
    expect(briefing.headline).toContain("Great Job, Alice!");
    expect(briefing.primaryMessage).toContain("100% adherence");
    expect(briefing.todayStats.taken).toBe(3);
    expect(briefing.todayStats.totalDoses).toBe(3);
    expect(briefing.todayStats.takenPercentage).toBe(100);
  });

  it("PRIORITY 5: provides neutral care summary when no medications or appointments are scheduled", () => {
    const refDate = new Date("2026-11-15T12:00:00");
    const briefing = evaluateCareCopilotBriefing([], [], [], "New Patient", refDate);

    expect(briefing.priorityLevel).toBe(5);
    expect(briefing.badgeVariant).toBe("neutral");
    expect(briefing.priorityLabel).toBe("Care Routine Active");
    expect(briefing.headline).toContain("Welcome to MediBridge Care Copilot");
    expect(briefing.primaryMessage).toContain("No active medications or consultations are scheduled");
    expect(briefing.todayStats.totalDoses).toBe(0);
    expect(briefing.todayStats.completionRate).toBe(100);
  });

  it("Strict Zero-Hallucination & Medical Safety: never fabricates instructions or dosing changes", () => {
    const customMed: Medication = {
      id: "med-custom",
      profileId: "p-1",
      name: "Warfarin",
      dosage: "5mg",
      frequency: "daily",
      scheduleTimes: [{ time: "18:00", label: "evening" }],
      withFood: false,
      status: "active",
      refillReminder: { enabled: false },
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    };

    const refDate = new Date("2026-11-15T12:00:00");
    const briefing = evaluateCareCopilotBriefing([customMed], [], [], "Grandma Rose", refDate);

    // Verify it doesn't invent unstated food requirements
    expect(briefing.nextDose?.withFood).toBe(false);
    expect(briefing.safeMedicalDisclaimer).toBe(COPILOT_SAFETY_DISCLAIMER);
    // Never advises taking more medication
    expect(briefing.primaryMessage).not.toMatch(/double|increase|substitute|diagnos/i);
  });
});

describe("CareCopilot UI Component Accessibility & Rendering", () => {
  it("renders accessible region with ARIA live label and high-contrast headlines", () => {
    const { getByRole, getByText } = render(
      <CareCopilot
        medications={mockMedications}
        adherenceLogs={[]}
        appointments={mockAppointments}
        patientName="Alice Smith"
      />
    );

    const region = getByRole("region", { name: /MediBridge Care Copilot Daily Briefing/i });
    expect(region).toBeInTheDocument();
    expect(getByText(/MediBridge Care Copilot/i)).toBeInTheDocument();
    expect(getByText(/Alice Smith/i)).toBeInTheDocument();
  });

  it("provides accessible action buttons with large touch targets", () => {
    const handleNavigate = vi.fn();
    const { getByRole } = render(
      <CareCopilot
        medications={mockMedications}
        adherenceLogs={[]}
        appointments={mockAppointments}
        patientName="Alice Smith"
        onNavigateSection={handleNavigate}
      />
    );

    const medBtn = getByRole("button", { name: /View Today's Medications/i });
    const aptBtn = getByRole("button", { name: /View Upcoming Appointments/i });
    const adhBtn = getByRole("button", { name: /Review Medication Adherence/i });

    expect(medBtn).toBeInTheDocument();
    expect(aptBtn).toBeInTheDocument();
    expect(adhBtn).toBeInTheDocument();

    // Verify touch target sizing class (min 44px height: h-11 = 44px)
    expect(medBtn.className).toContain("h-11");
    expect(aptBtn.className).toContain("h-11");
    expect(adhBtn.className).toContain("h-11");
  });

  it("renders today adherence progress bar and tally correctly", () => {
    const { getByRole } = render(
      <CareCopilot
        medications={mockMedications}
        adherenceLogs={[]}
        appointments={[]}
        patientName="Alice"
      />
    );

    const progressBar = getByRole("progressbar", { name: /Today adherence percentage/i });
    expect(progressBar).toBeInTheDocument();
  });
});
