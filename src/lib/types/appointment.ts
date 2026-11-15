export type AppointmentStatus = "upcoming" | "completed" | "cancelled" | "rescheduled";

export interface Appointment {
  id: string;
  profileId: string;
  title: string; // e.g. "Cardiology Follow-Up"
  doctorName: string;
  specialty: string; // e.g. "Cardiology", "Primary Care", "Ophthalmology"
  clinicName: string;
  address: string;
  phone?: string;
  dateTime: string; // ISO 8601 string
  durationMinutes: number;
  status: AppointmentStatus;
  purpose: string;
  questionsToAsk?: string[];
  preparationNotes?: string; // e.g. "Fasting required 8 hours prior"
  transportAssistanceNeeded: boolean;
  assignedCompanion?: {
    userId: string;
    userName: string;
  };
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}
