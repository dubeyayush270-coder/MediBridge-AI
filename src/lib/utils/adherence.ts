import { Medication, MedicationAdherenceLog, AdherenceStatus } from "../types/medication";

/**
 * Formats a Date object to YYYY-MM-DD in the user's local timezone.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Generates today's dynamic schedule of medication dose slots.
 * Matches each scheduled time against existing adherence logs for today.
 */
export function generateTodaySchedule(
  medications: Medication[],
  adherenceLogs: MedicationAdherenceLog[],
  targetDate: string = getLocalDateString()
): MedicationAdherenceLog[] {
  const activeMeds = medications.filter((m) => m.status === "active");
  const schedule: MedicationAdherenceLog[] = [];

  // Index today's logs by medicationId and scheduled time for O(1) lookup efficiency
  const todayLogsMap = new Map<string, MedicationAdherenceLog>();
  for (const log of adherenceLogs) {
    if (log.scheduledDate === targetDate) {
      const cleanTime = (log.scheduledTime || "").replace(/[^0-9]/g, "");
      todayLogsMap.set(`${log.medicationId}_${log.scheduledTime}`, log);
      todayLogsMap.set(`${log.medicationId}_${cleanTime}`, log);
    }
  }

  for (const med of activeMeds) {
    const times = med.scheduleTimes && med.scheduleTimes.length > 0
      ? med.scheduleTimes
      : [{ time: "08:00", label: "morning" as const }];

    for (const slot of times) {
      const cleanTime = slot.time.replace(/[^0-9]/g, "");
      const expectedSlotId = `adh_${med.profileId}_${med.id}_${targetDate}_${cleanTime}`;

      // O(1) fast lookup
      const existing =
        todayLogsMap.get(`${med.id}_${slot.time}`) ||
        todayLogsMap.get(`${med.id}_${cleanTime}`);

      if (existing) {
        schedule.push({
          ...existing,
          medicationName: med.name,
          dosage: med.dosage,
        });
      } else {
        schedule.push({
          id: expectedSlotId,
          profileId: med.profileId,
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          scheduledTime: slot.time,
          scheduledDate: targetDate,
          status: "pending",
        });
      }
    }
  }

  // Sort chronologically by scheduled time
  schedule.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  return schedule;
}

export interface AdherenceStats {
  todayTotal: number;
  todayTaken: number;
  todaySkipped: number;
  todayMissed: number;
  todayPending: number;
  todayRate: number; // Percentage 0 - 100
  weeklyTotal: number;
  weeklyTaken: number;
  weeklyRate: number; // Percentage 0 - 100
  streakDays: number;
}

/**
 * Calculates daily and weekly adherence metrics and streak.
 */
export function calculateAdherenceStats(
  medications: Medication[],
  adherenceLogs: MedicationAdherenceLog[],
  todayStr: string = getLocalDateString()
): AdherenceStats {
  // Today's schedule
  const todaySchedule = generateTodaySchedule(medications, adherenceLogs, todayStr);
  const todayTotal = todaySchedule.length;
  const todayTaken = todaySchedule.filter((l) => l.status === "taken").length;
  const todaySkipped = todaySchedule.filter((l) => l.status === "skipped").length;
  const todayMissed = todaySchedule.filter((l) => l.status === "missed").length;
  const todayPending = todaySchedule.filter((l) => l.status === "pending").length;

  const todayCompleted = todayTaken + todaySkipped + todayMissed;
  const todayRate =
    todayTotal === 0
      ? 100
      : todayCompleted > 0
      ? Math.round((todayTaken / todayTotal) * 100)
      : 0;

  // Weekly calculations (past 7 days)
  const now = new Date();
  const pastWeekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    pastWeekDates.push(getLocalDateString(d));
  }

  const pastWeekSet = new Set(pastWeekDates);
  const weeklyLogs = adherenceLogs.filter((l) => pastWeekSet.has(l.scheduledDate));
  const weeklyTaken = weeklyLogs.filter((l) => l.status === "taken").length;
  const weeklyTotalDecided = weeklyLogs.filter(
    (l) => l.status === "taken" || l.status === "skipped" || l.status === "missed"
  ).length;

  const weeklyRate =
    weeklyTotalDecided > 0
      ? Math.round((weeklyTaken / weeklyTotalDecided) * 100)
      : todayTotal > 0
      ? todayRate
      : 100;

  // Streak calculation: count consecutive prior days with at least 1 taken dose and 0 missed doses
  let streak = todayTaken > 0 ? 1 : 0;
  for (let i = 1; i <= 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayLogs = adherenceLogs.filter((l) => l.scheduledDate === dateStr);

    if (dayLogs.length === 0) {
      break;
    }

    const dayTaken = dayLogs.filter((l) => l.status === "taken").length;
    const dayMissed = dayLogs.filter((l) => l.status === "missed").length;

    if (dayTaken > 0 && dayMissed === 0) {
      streak += 1;
    } else {
      break;
    }
  }

  return {
    todayTotal,
    todayTaken,
    todaySkipped,
    todayMissed,
    todayPending,
    todayRate,
    weeklyTotal: weeklyTotalDecided,
    weeklyTaken,
    weeklyRate,
    streakDays: streak,
  };
}
