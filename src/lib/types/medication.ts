export type MedicationStatus = "active" | "paused" | "discontinued";

export type MedicationFrequency = "daily" | "twice_daily" | "three_times_daily" | "weekly" | "as_needed";

export type AdherenceStatus = "pending" | "taken" | "skipped" | "missed" | "late";

export interface MedicationScheduleTime {
  time: string; // HH:mm format e.g. "08:00"
  label: "morning" | "noon" | "evening" | "bedtime" | "custom";
}

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  genericName?: string;
  dosage: string; // e.g. "10mg", "1 tablet"
  route?: string; // e.g. "Oral", "Inhalation"
  frequency: "daily" | "twice_daily" | "three_times_daily" | "weekly" | "as_needed";
  scheduleTimes: MedicationScheduleTime[];
  withFood: boolean;
  specialInstructions?: string;
  prescribingDoctor?: string;
  prescribedFor?: string; // e.g. "Blood pressure control"
  status: MedicationStatus;
  refillReminder: {
    enabled: boolean;
    remainingDoses?: number;
    refillAtDate?: string;
  };
  pillVisual?: {
    color?: string;
    shape?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MedicationAdherenceLog {
  id: string;
  profileId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string; // ISO Date string or "HH:mm"
  scheduledDate: string; // YYYY-MM-DD
  status: AdherenceStatus;
  loggedAt?: string;
  loggedBy?: {
    userId: string;
    userName: string;
    role: string;
  };
  notes?: string;
}
