import { Medication, MedicationAdherenceLog } from "../types/medication";
import { Appointment } from "../types/appointment";
import { generateTodaySchedule, getLocalDateString } from "../utils/adherence";
import { formatElderDate, formatElderTime } from "../utils";

export type CopilotPriorityLevel = 1 | 2 | 3 | 4 | 5;

export interface CopilotDoseSummary {
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  formattedTime: string;
  status: "pending" | "taken" | "skipped" | "missed";
  specialInstructions?: string;
  withFood: boolean;
  pillColor?: string;
  pillShape?: string;
}

export interface CopilotAppointmentSummary {
  appointmentId: string;
  title: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  address: string;
  dateTime: string;
  formattedDate: string;
  formattedTime: string;
  hoursUntil: number;
  preparationNotes?: string;
  transportAssistanceNeeded: boolean;
  assignedCompanionName?: string;
}

export interface CopilotTodayStats {
  totalDoses: number;
  taken: number;
  skipped: number;
  missed: number;
  pending: number;
  completionRate: number; // 0 - 100
  takenPercentage: number; // 0 - 100
}

export interface CopilotBriefing {
  priorityLevel: CopilotPriorityLevel;
  priorityLabel: string;
  badgeVariant: "critical" | "warning" | "info" | "success" | "neutral";
  headline: string;
  primaryMessage: string;
  guidanceNote?: string;
  nextDose?: CopilotDoseSummary;
  missedDoses: CopilotDoseSummary[];
  upcomingAppointment?: CopilotAppointmentSummary;
  todayStats: CopilotTodayStats;
  attentionItems: string[];
  safeMedicalDisclaimer: string;
}

/**
 * Standard safety disclaimer enforced across all briefings
 * strictly guaranteeing zero hallucinated clinical advice.
 */
export const COPILOT_SAFETY_DISCLAIMER =
  "MediBridge Care Copilot provides schedule coordination and reminders based strictly on your saved prescriptions. Always consult your healthcare provider or pharmacist regarding medication changes, missed doses, or symptoms. Never double up on missed doses.";

/**
 * Evaluates the active patient's schedule, adherence logs, and appointments
 * using deterministic contextual prioritization (Priorities 1 to 5).
 *
 * @param medications All medications for the active profile
 * @param adherenceLogs All adherence logs for the active profile
 * @param appointments All appointments for the active profile
 * @param patientName Display name of the active patient
 * @param referenceDate Optional reference Date for deterministic testing
 */
export function evaluateCareCopilotBriefing(
  medications: Medication[],
  adherenceLogs: MedicationAdherenceLog[],
  appointments: Appointment[],
  patientName: string = "Patient",
  referenceDate: Date = new Date()
): CopilotBriefing {
  const targetDateStr = getLocalDateString(referenceDate);
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  // 1. Build today's active schedule
  const todayScheduleLogs = generateTodaySchedule(medications, adherenceLogs, targetDateStr);

  // Map to rich dose summaries
  const scheduleSummaries: CopilotDoseSummary[] = todayScheduleLogs.map((log) => {
    const parentMed = medications.find((m) => m.id === log.medicationId);
    return {
      medicationId: log.medicationId,
      medicationName: log.medicationName || parentMed?.name || "Medication",
      dosage: log.dosage || parentMed?.dosage || "As prescribed",
      scheduledTime: log.scheduledTime,
      formattedTime: formatElderTime(log.scheduledTime),
      status: (log.status as "pending" | "taken" | "skipped" | "missed") || "pending",
      specialInstructions: parentMed?.specialInstructions,
      withFood: Boolean(parentMed?.withFood),
      pillColor: parentMed?.pillVisual?.color,
      pillShape: parentMed?.pillVisual?.shape,
    };
  });

  const totalDoses = scheduleSummaries.length;
  const taken = scheduleSummaries.filter((d) => d.status === "taken").length;
  const skipped = scheduleSummaries.filter((d) => d.status === "skipped").length;
  const missed = scheduleSummaries.filter((d) => d.status === "missed").length;
  const pending = scheduleSummaries.filter((d) => d.status === "pending").length;

  const decided = taken + skipped + missed;
  const completionRate = totalDoses > 0 ? Math.round((decided / totalDoses) * 100) : 100;
  const takenPercentage = totalDoses > 0 ? Math.round((taken / totalDoses) * 100) : 100;

  const todayStats: CopilotTodayStats = {
    totalDoses,
    taken,
    skipped,
    missed,
    pending,
    completionRate,
    takenPercentage,
  };

  // Identify overdue pending doses (scheduled time was more than 30 minutes ago)
  const overdueDoses = scheduleSummaries.filter((d) => {
    if (d.status !== "pending") return false;
    const [h, m] = d.scheduledTime.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return false;
    const doseMinutes = h * 60 + m;
    return currentMinutes > doseMinutes + 30; // 30 min grace period
  });

  const explicitlyMissedDoses = scheduleSummaries.filter((d) => d.status === "missed");
  const allUrgentDoses = [...explicitlyMissedDoses, ...overdueDoses];

  // Identify upcoming pending doses (closest scheduled time >= now - 15m)
  const upcomingPendingDoses = scheduleSummaries
    .filter((d) => d.status === "pending")
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const nextDose = upcomingPendingDoses[0];

  // 2. Identify upcoming appointments
  const upcomingAppointments = appointments
    .filter((a) => a.status === "upcoming")
    .map((a) => {
      const aptTime = new Date(a.dateTime).getTime();
      const diffMs = aptTime - referenceDate.getTime();
      const hoursUntil = Math.round(diffMs / (1000 * 60 * 60));
      return {
        appointmentId: a.id,
        title: a.title,
        doctorName: a.doctorName,
        specialty: a.specialty,
        clinicName: a.clinicName,
        address: a.address,
        dateTime: a.dateTime,
        formattedDate: formatElderDate(a.dateTime),
        formattedTime: formatElderTime(new Date(a.dateTime)),
        hoursUntil,
        preparationNotes: a.preparationNotes,
        transportAssistanceNeeded: Boolean(a.transportAssistanceNeeded),
        assignedCompanionName: a.assignedCompanion?.userName,
      };
    })
    // Only future or today's appointments within 7 days
    .filter((a) => a.hoursUntil >= -2 && a.hoursUntil <= 24 * 7)
    .sort((a, b) => a.hoursUntil - b.hoursUntil);

  const nearestAppointment = upcomingAppointments[0];
  const isAppointmentWithin24Hours =
    nearestAppointment &&
    nearestAppointment.hoursUntil >= 0 &&
    nearestAppointment.hoursUntil <= 24;

  // 3. Compile Attention Items
  const attentionItems: string[] = [];
  if (allUrgentDoses.length > 0) {
    attentionItems.push(
      `${allUrgentDoses.length} dose${allUrgentDoses.length > 1 ? "s" : ""} marked missed or overdue today.`
    );
  }
  if (isAppointmentWithin24Hours && nearestAppointment) {
    attentionItems.push(
      `Appointment with Dr. ${nearestAppointment.doctorName} in ${Math.max(1, nearestAppointment.hoursUntil)} hour${
        nearestAppointment.hoursUntil === 1 ? "" : "s"
      }.`
    );
    if (nearestAppointment.preparationNotes) {
      attentionItems.push(`Prep note: ${nearestAppointment.preparationNotes}`);
    }
    if (nearestAppointment.transportAssistanceNeeded) {
      attentionItems.push(
        nearestAppointment.assignedCompanionName
          ? `Transport escort confirmed: ${nearestAppointment.assignedCompanionName}`
          : "Transport assistance requested."
      );
    }
  }

  // ==========================================
  // DETERMINISTIC CONTEXTUAL PRIORITIZATION
  // ==========================================

  // PRIORITY 1: Overdue or missed medication records
  if (allUrgentDoses.length > 0) {
    const firstUrgent = allUrgentDoses[0];
    const isOverduePending = firstUrgent.status === "pending";
    const statusLabel = isOverduePending ? "past its scheduled time" : "marked missed";

    return {
      priorityLevel: 1,
      priorityLabel: "Action Needed",
      badgeVariant: "critical",
      headline: `Medication Check-In Required`,
      primaryMessage: `A scheduled dose of ${firstUrgent.medicationName} (${firstUrgent.dosage}) is ${statusLabel}.`,
      guidanceNote:
        "Please check with your prescribing doctor or pharmacist for safe guidance before taking your medication, and never take a double dose to make up for a missed one.",
      nextDose,
      missedDoses: allUrgentDoses,
      upcomingAppointment: nearestAppointment,
      todayStats,
      attentionItems,
      safeMedicalDisclaimer: COPILOT_SAFETY_DISCLAIMER,
    };
  }

  // PRIORITY 2: Medication doses approaching their scheduled time
  if (nextDose) {
    const instructionParts: string[] = [];
    if (nextDose.withFood) {
      instructionParts.push("Take with meals or food as directed.");
    }
    if (nextDose.specialInstructions) {
      instructionParts.push(nextDose.specialInstructions);
    }

    const guidance =
      instructionParts.length > 0
        ? `Prescribed instructions: ${instructionParts.join(" ")}`
        : "Prepare a glass of water and take as prescribed by your doctor.";

    return {
      priorityLevel: 2,
      priorityLabel: "Upcoming Dose",
      badgeVariant: "warning",
      headline: `Next Dose: ${nextDose.medicationName}`,
      primaryMessage: `Your next scheduled dose of ${nextDose.medicationName} (${nextDose.dosage}) is scheduled for ${nextDose.formattedTime}.`,
      guidanceNote: guidance,
      nextDose,
      missedDoses: [],
      upcomingAppointment: nearestAppointment,
      todayStats,
      attentionItems,
      safeMedicalDisclaimer: COPILOT_SAFETY_DISCLAIMER,
    };
  }

  // PRIORITY 3: Appointments approaching within 24 hours
  if (isAppointmentWithin24Hours && nearestAppointment) {
    const prepInfo = nearestAppointment.preparationNotes
      ? ` Saved preparation instructions: "${nearestAppointment.preparationNotes}".`
      : "";
    const transportInfo = nearestAppointment.transportAssistanceNeeded
      ? nearestAppointment.assignedCompanionName
        ? ` Transport assistance is arranged with companion ${nearestAppointment.assignedCompanionName}.`
        : " Transport assistance is marked as needed."
      : "";

    return {
      priorityLevel: 3,
      priorityLabel: "Upcoming Appointment",
      badgeVariant: "info",
      headline: `Consultation with Dr. ${nearestAppointment.doctorName}`,
      primaryMessage: `You have an appointment scheduled on ${nearestAppointment.formattedDate} at ${nearestAppointment.formattedTime} at ${nearestAppointment.clinicName} (${nearestAppointment.specialty}).${prepInfo}${transportInfo}`,
      guidanceNote:
        "Remember to bring your photo ID, insurance card, and current medication list to your visit.",
      nextDose: undefined,
      missedDoses: [],
      upcomingAppointment: nearestAppointment,
      todayStats,
      attentionItems,
      safeMedicalDisclaimer: COPILOT_SAFETY_DISCLAIMER,
    };
  }

  // PRIORITY 4: Positive adherence progress
  if (totalDoses > 0 && taken === totalDoses) {
    return {
      priorityLevel: 4,
      priorityLabel: "All Doses Taken",
      badgeVariant: "success",
      headline: `Great Job, ${patientName}!`,
      primaryMessage: `You have successfully taken all ${totalDoses} scheduled medication doses for today with 100% adherence.`,
      guidanceNote:
        "Your consistency helps keep your health on track. Your care circle has been updated.",
      nextDose: undefined,
      missedDoses: [],
      upcomingAppointment: nearestAppointment,
      todayStats,
      attentionItems,
      safeMedicalDisclaimer: COPILOT_SAFETY_DISCLAIMER,
    };
  }

  // PRIORITY 5: Neutral daily care summary (or empty active plan)
  const neutralHeadline =
    totalDoses === 0
      ? `Welcome to MediBridge Care Copilot`
      : `Daily Care Plan Up to Date`;

  const neutralMessage =
    totalDoses === 0
      ? `No active medications or consultations are scheduled for ${patientName} today. You can add prescriptions or appointments below.`
      : `All scheduled tasks for ${patientName} are currently up to date. MediBridge Copilot will alert you when your next dose or consultation approaches.`;

  return {
    priorityLevel: 5,
    priorityLabel: "Care Routine Active",
    badgeVariant: "neutral",
    headline: neutralHeadline,
    primaryMessage: neutralMessage,
    guidanceNote:
      "Stay hydrated, rest well, and reach out to your care circle if you need any assistance today.",
    nextDose: undefined,
    missedDoses: [],
    upcomingAppointment: nearestAppointment,
    todayStats,
    attentionItems,
    safeMedicalDisclaimer: COPILOT_SAFETY_DISCLAIMER,
  };
}
