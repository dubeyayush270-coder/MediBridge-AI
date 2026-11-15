import { describe, it, expect } from "vitest";
import {
  getUtcTimestampForLocalTime,
  isDoseUpcomingEligible,
  isDoseMissedEligible,
  isAppointmentUpcomingEligible,
  generateMedicationReminderKey,
  generateMissedDoseAlertKey,
  generateAppointmentReminderKey,
} from "../lib/notifications/scheduler-evaluator";
import { Appointment } from "../lib/types/appointment";

describe("Milestone 3 — Timezone, Evaluation & Idempotency Tests", () => {
  describe("1. Timezone Conversions (getUtcTimestampForLocalTime)", () => {
    it("correctly converts local date/time in UTC", () => {
      const utcDate = getUtcTimestampForLocalTime("2026-11-20", "08:00", "UTC");
      expect(utcDate.toISOString()).toBe("2026-11-20T08:00:00.000Z");
    });

    it("correctly converts local date/time in America/New_York (UTC-5 in winter)", () => {
      // 08:00 in New York (EST) is 13:00 UTC
      const nyDate = getUtcTimestampForLocalTime("2026-11-20", "08:00", "America/New_York");
      expect(nyDate.getUTCHours()).toBe(13);
      expect(nyDate.getUTCMinutes()).toBe(0);
    });

    it("correctly converts local date/time in Asia/Kolkata (UTC+5:30)", () => {
      // 08:00 in India is 02:30 UTC
      const istDate = getUtcTimestampForLocalTime("2026-11-20", "08:00", "Asia/Kolkata");
      expect(istDate.getUTCHours()).toBe(2);
      expect(istDate.getUTCMinutes()).toBe(30);
    });

    it("safely falls back to direct UTC if timezone name is invalid", () => {
      const fallback = getUtcTimestampForLocalTime("2026-11-20", "09:30", "Invalid/Timezone_Name");
      expect(fallback.toISOString()).toBe("2026-11-20T09:30:00.000Z");
    });
  });

  describe("2. Upcoming Dose Reminder Eligibility", () => {
    it("is eligible when current time is 20 minutes before scheduled dose (30 min lead)", () => {
      // Dose at 08:00 UTC, now is 07:40 UTC
      const now = new Date("2026-11-20T07:40:00.000Z");
      const eligible = isDoseUpcomingEligible({
        scheduledDate: "2026-11-20",
        scheduledTime: "08:00",
        timezone: "UTC",
        leadMinutes: 30,
        now,
      });
      expect(eligible).toBe(true);
    });

    it("is NOT eligible when current time is 45 minutes before scheduled dose (too early)", () => {
      const now = new Date("2026-11-20T07:15:00.000Z");
      const eligible = isDoseUpcomingEligible({
        scheduledDate: "2026-11-20",
        scheduledTime: "08:00",
        timezone: "UTC",
        leadMinutes: 30,
        now,
      });
      expect(eligible).toBe(false);
    });

    it("is NOT eligible if adherence record already exists (dose taken or logged)", () => {
      const now = new Date("2026-11-20T07:45:00.000Z");
      const eligible = isDoseUpcomingEligible({
        scheduledDate: "2026-11-20",
        scheduledTime: "08:00",
        timezone: "UTC",
        leadMinutes: 30,
        now,
        hasAdherenceRecord: true,
      });
      expect(eligible).toBe(false);
    });
  });

  describe("3. Missed Dose Alert Eligibility", () => {
    it("is eligible when current time is 75 minutes past scheduled dose (60 min grace)", () => {
      // Dose at 08:00 UTC, now is 09:15 UTC (75m past)
      const now = new Date("2026-11-20T09:15:00.000Z");
      const eligible = isDoseMissedEligible({
        scheduledDate: "2026-11-20",
        scheduledTime: "08:00",
        timezone: "UTC",
        graceMinutes: 60,
        now,
        adherenceStatus: null,
      });
      expect(eligible).toBe(true);
    });

    it("is NOT eligible when within grace period (e.g. 25 minutes past dose)", () => {
      const now = new Date("2026-11-20T08:25:00.000Z");
      const eligible = isDoseMissedEligible({
        scheduledDate: "2026-11-20",
        scheduledTime: "08:00",
        timezone: "UTC",
        graceMinutes: 60,
        now,
        adherenceStatus: null,
      });
      expect(eligible).toBe(false);
    });

    it("is NOT eligible if dose was marked taken", () => {
      const now = new Date("2026-11-20T10:00:00.000Z");
      const eligible = isDoseMissedEligible({
        scheduledDate: "2026-11-20",
        scheduledTime: "08:00",
        timezone: "UTC",
        graceMinutes: 60,
        now,
        adherenceStatus: "taken",
      });
      expect(eligible).toBe(false);
    });

    it("is NOT eligible if dose was intentionally marked skipped", () => {
      const now = new Date("2026-11-20T10:00:00.000Z");
      const eligible = isDoseMissedEligible({
        scheduledDate: "2026-11-20",
        scheduledTime: "08:00",
        timezone: "UTC",
        graceMinutes: 60,
        now,
        adherenceStatus: "skipped",
      });
      expect(eligible).toBe(false);
    });
  });

  describe("4. Doctor Appointment Reminder Eligibility", () => {
    const baseAppointment: Appointment = {
      id: "apt-cardio-123",
      profileId: "profile-alice",
      title: "Cardiology Follow-Up",
      doctorName: "Sarah Jenkins",
      specialty: "Cardiology",
      clinicName: "Metro Heart Institute",
      address: "100 Medical Plaza",
      dateTime: "2026-11-22T14:00:00.000Z", // 2 days out
      durationMinutes: 30,
      status: "upcoming",
      purpose: "Check BP",
      transportAssistanceNeeded: false,
      reminderSent: false,
      createdAt: "2026-11-15T00:00:00.000Z",
      updatedAt: "2026-11-15T00:00:00.000Z",
    };

    it("is eligible when 18 hours before appointment (24h lead window)", () => {
      // Appointment is 2026-11-22T14:00:00Z
      // 18 hours prior is 2026-11-21T20:00:00Z
      const now = new Date("2026-11-21T20:00:00.000Z");
      const eligible = isAppointmentUpcomingEligible({
        appointment: baseAppointment,
        leadHours: 24,
        now,
      });
      expect(eligible).toBe(true);
    });

    it("is NOT eligible when 48 hours before appointment (too early)", () => {
      const now = new Date("2026-11-20T14:00:00.000Z");
      const eligible = isAppointmentUpcomingEligible({
        appointment: baseAppointment,
        leadHours: 24,
        now,
      });
      expect(eligible).toBe(false);
    });

    it("is strictly NOT eligible if appointment is cancelled", () => {
      const cancelledApt: Appointment = {
        ...baseAppointment,
        status: "cancelled",
      };
      const now = new Date("2026-11-21T20:00:00.000Z");
      const eligible = isAppointmentUpcomingEligible({
        appointment: cancelledApt,
        leadHours: 24,
        now,
      });
      expect(eligible).toBe(false);
    });

    it("is NOT eligible if reminder was already marked sent", () => {
      const alreadySentApt: Appointment = {
        ...baseAppointment,
        reminderSent: true,
      };
      const now = new Date("2026-11-21T20:00:00.000Z");
      const eligible = isAppointmentUpcomingEligible({
        appointment: alreadySentApt,
        leadHours: 24,
        now,
      });
      expect(eligible).toBe(false);
    });
  });

  describe("5. Deterministic Idempotency Keys", () => {
    it("generates deterministic medication reminder key", () => {
      const key = generateMedicationReminderKey("prof-1", "med-2", "2026-11-20", "08:00");
      expect(key).toBe("notif_prof-1_med-2_2026-11-20_0800_reminder");
    });

    it("generates deterministic missed dose alert key with recipient ID", () => {
      const key = generateMissedDoseAlertKey("prof-1", "med-2", "2026-11-20", "08:00", "user-daughter");
      expect(key).toBe("notif_prof-1_med-2_2026-11-20_0800_missed_user-daughter");
    });

    it("generates deterministic appointment reminder key with recipient ID", () => {
      const key = generateAppointmentReminderKey("prof-1", "apt-99", "user-patient");
      expect(key).toBe("notif_prof-1_apt-99_reminder_user-patient");
    });
  });
});
