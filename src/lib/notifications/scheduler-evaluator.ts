/**
 * Core Evaluation Engine for Medication and Appointment Notifications
 * Milestone 3 - Idempotent, Timezone-Aware Evaluation
 */

import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "../types/notification";
import { Medication, MedicationAdherenceLog, AdherenceStatus } from "../types/medication";
import { Appointment } from "../types/appointment";

/**
 * Creates a UTC Date representing `YYYY-MM-DD HH:mm` in the specified IANA timezone.
 * Falls back to UTC if timezone is invalid or unrecognized.
 */
export function getUtcTimestampForLocalTime(
  dateStr: string, // "YYYY-MM-DD"
  timeStr: string, // "HH:mm"
  timezone: string = "UTC"
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  try {
    // Attempt timezone offset calculation using Intl
    // Create an initial guess in UTC
    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(utcGuess);
    const partMap: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== "literal") {
        partMap[p.type] = Number(p.value);
      }
    }

    // Calculate diff between target local time and formatter local time
    const tzYear = partMap.year || year;
    const tzMonth = (partMap.month || month) - 1;
    const tzDay = partMap.day || day;
    const tzHour = (partMap.hour === 24 ? 0 : partMap.hour) || 0;
    const tzMinute = partMap.minute || 0;

    const formattedAsUtc = Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute, 0);
    const offsetMs = formattedAsUtc - utcGuess.getTime();

    // Adjust UTC guess by the offset
    return new Date(utcGuess.getTime() - offsetMs);
  } catch {
    // If timezone is invalid or Intl fails, default to direct UTC
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  }
}

/**
 * Idempotency Key Generators
 */
export function generateMedicationReminderKey(
  profileId: string,
  medicationId: string,
  dateStr: string,
  timeStr: string
): string {
  const cleanTime = timeStr.replace(/[^0-9]/g, "");
  return `notif_${profileId}_${medicationId}_${dateStr}_${cleanTime}_reminder`;
}

export function generateMissedDoseAlertKey(
  profileId: string,
  medicationId: string,
  dateStr: string,
  timeStr: string,
  recipientUid: string
): string {
  const cleanTime = timeStr.replace(/[^0-9]/g, "");
  return `notif_${profileId}_${medicationId}_${dateStr}_${cleanTime}_missed_${recipientUid}`;
}

export function generateAppointmentReminderKey(
  profileId: string,
  appointmentId: string,
  recipientUid: string
): string {
  return `notif_${profileId}_${appointmentId}_reminder_${recipientUid}`;
}

/**
 * 1. Evaluate Medication Upcoming Reminder Eligibility
 */
export function isDoseUpcomingEligible(params: {
  scheduledDate: string; // "YYYY-MM-DD"
  scheduledTime: string; // "HH:mm"
  timezone?: string;
  leadMinutes?: number;
  now?: Date;
  hasAdherenceRecord?: boolean;
}): boolean {
  if (params.hasAdherenceRecord) return false;

  const now = params.now || new Date();
  const leadMinutes = params.leadMinutes ?? DEFAULT_NOTIFICATION_PREFERENCES.reminderLeadMinutes;
  const targetUtc = getUtcTimestampForLocalTime(
    params.scheduledDate,
    params.scheduledTime,
    params.timezone || "UTC"
  );

  const windowStart = targetUtc.getTime() - leadMinutes * 60 * 1000;
  // Lead window extends until 15 minutes past the dose time
  const windowEnd = targetUtc.getTime() + 15 * 60 * 1000;

  return now.getTime() >= windowStart && now.getTime() < windowEnd;
}

/**
 * 2. Evaluate Missed Dose Alert Eligibility
 */
export function isDoseMissedEligible(params: {
  scheduledDate: string; // "YYYY-MM-DD"
  scheduledTime: string; // "HH:mm"
  timezone?: string;
  graceMinutes?: number;
  now?: Date;
  adherenceStatus?: AdherenceStatus | null;
}): boolean {
  // If user already took or intentionally skipped, it is not missed
  if (params.adherenceStatus === "taken" || params.adherenceStatus === "skipped") {
    return false;
  }

  const now = params.now || new Date();
  const graceMinutes = params.graceMinutes ?? DEFAULT_NOTIFICATION_PREFERENCES.missedGraceMinutes;
  const targetUtc = getUtcTimestampForLocalTime(
    params.scheduledDate,
    params.scheduledTime,
    params.timezone || "UTC"
  );

  const missedThreshold = targetUtc.getTime() + graceMinutes * 60 * 1000;
  // Alert window: between grace threshold and 18 hours after dose time (to avoid alerting for ancient doses)
  const windowMax = targetUtc.getTime() + 18 * 3600 * 1000;

  return now.getTime() >= missedThreshold && now.getTime() <= windowMax;
}

/**
 * 3. Evaluate Appointment Reminder Eligibility
 */
export function isAppointmentUpcomingEligible(params: {
  appointment: Appointment;
  leadHours?: number;
  now?: Date;
}): boolean {
  const apt = params.appointment;
  if (!apt || apt.status !== "upcoming" || apt.reminderSent) {
    return false;
  }

  const aptTime = new Date(apt.dateTime).getTime();
  if (isNaN(aptTime)) return false;

  const now = params.now || new Date();
  const leadHours = params.leadHours ?? DEFAULT_NOTIFICATION_PREFERENCES.appointmentLeadHours;

  const reminderWindowStart = aptTime - leadHours * 3600 * 1000;
  return now.getTime() >= reminderWindowStart && now.getTime() < aptTime;
}
