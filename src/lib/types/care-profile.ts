export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface CareProfile {
  id: string;
  patientName: string;
  preferredName?: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender?: string;
  bloodType?: string;
  primaryConditionNotes?: string;
  allergies: string[];
  primaryDoctor: {
    name: string;
    clinic: string;
    phone: string;
  };
  emergencyContacts: EmergencyContact[];
  createdBy: string; // User UID
  createdAt: string;
  updatedAt: string;
}
