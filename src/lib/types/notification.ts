/**
 * Notification and Email types for MediBridge AI
 * Milestone 3 - Transactional Care Reminders
 */

export type NotificationType =
  | "medication_reminder"
  | "missed_dose_alert"
  | "appointment_reminder"
  | "test_email";

export type NotificationDeliveryStatus = "pending" | "sent" | "failed" | "skipped";

export interface NotificationPreferences {
  medicationReminders: boolean;       // Enable upcoming dose reminders
  missedDoseAlerts: boolean;          // Enable missed dose alerts
  appointmentReminders: boolean;      // Enable doctor appointment reminders
  caregiverAlerts: boolean;           // Notify designated caregivers if dose missed
  preferredTimezone: string;          // e.g. "America/New_York", "UTC"
  reminderLeadMinutes: number;        // Minutes before dose to send reminder (default: 30)
  missedGraceMinutes: number;         // Minutes after dose time before marking missed (default: 60)
  appointmentLeadHours: number;       // Hours before appointment to send reminder (default: 24)
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  medicationReminders: true,
  missedDoseAlerts: true,
  appointmentReminders: true,
  caregiverAlerts: true,
  preferredTimezone: "UTC",
  reminderLeadMinutes: 30,
  missedGraceMinutes: 60,
  appointmentLeadHours: 24,
};

export interface NotificationRecord {
  id: string; // Deterministic idempotency key e.g. notif_${profileId}_${medId}_${date}_${time}_reminder
  profileId: string;
  patientName: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: "patient" | "caregiver" | "family_member" | "elderly_patient";
  type: NotificationType;
  title: string;
  summary: string;
  scheduledFor: string; // ISO 8601 string of the scheduled event
  status: NotificationDeliveryStatus;
  sentAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDispatchPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  notificationId?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}
