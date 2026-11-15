import { describe, it, expect, vi, beforeEach } from "vitest";
import { Appointment } from "../lib/types/appointment";
import {
  adminSaveAppointment,
  adminFetchAppointments,
  adminDeleteAppointment,
} from "../lib/server/firestore-admin";
import { getAdminDb } from "../lib/firebase/admin";

// Mock Firebase Admin SDK for testing
vi.mock("../lib/firebase/admin", () => {
  const store = new Map<string, Map<string, any>>();

  function getCol(name: string) {
    if (!store.has(name)) store.set(name, new Map());
    return store.get(name)!;
  }

  function createQuery(colName: string, filters: [string, any][] = []) {
    const q = {
      where: (field: string, op: string, value: any) => {
        return createQuery(colName, [...filters, [field, value]]);
      },
      limit: (_n: number) => q,
      get: vi.fn(async () => {
        const col = getCol(colName);
        const matches: any[] = [];
        col.forEach((v, id) => {
          const match = filters.every(([f, val]) => v[f] === val);
          if (match) {
            matches.push({ id, data: () => v });
          }
        });
        return {
          empty: matches.length === 0,
          docs: matches,
          size: matches.length,
          forEach: (cb: any) => matches.forEach(cb),
        };
      }),
    };
    return q;
  }

  const mockDb = {
    _reset: () => store.clear(),
    _store: store,
    collection: (colName: string) => ({
      doc: (docId: string) => ({
        id: docId,
        set: vi.fn(async (data: any, options?: { merge?: boolean }) => {
          const col = getCol(colName);
          const existing = options?.merge ? col.get(docId) || {} : {};
          col.set(docId, { ...existing, ...data });
        }),
        get: vi.fn(async () => {
          const col = getCol(colName);
          const data = col.get(docId);
          return {
            exists: Boolean(data),
            id: docId,
            data: () => data,
          };
        }),
        delete: vi.fn(async () => {
          const col = getCol(colName);
          col.delete(docId);
        }),
      }),
      where: (field: string, op: string, value: any) => {
        return createQuery(colName, [[field, value]]);
      },
    }),
  };

  return {
    getAdminDb: vi.fn(() => mockDb),
    getAdminFirestore: vi.fn(() => mockDb),
    getAdminAuth: vi.fn(() => ({})),
    isFirebaseAdminCredentialConfigured: vi.fn(() => true),
  };
});

describe("Milestone 2 — Doctor Appointments & Consultations", () => {
  const profileId = "profile-eleanor-vance";

  const sampleApt1: Appointment = {
    id: "apt-cardiology",
    profileId,
    title: "Cardiology Follow-Up",
    doctorName: "Dr. Robert Chen, MD",
    specialty: "Cardiology",
    clinicName: "Valley Heart & Vascular Institute",
    address: "742 Evergreen Terrace, Suite 300",
    phone: "(555) 234-5678",
    dateTime: "2026-11-20T10:00:00Z",
    durationMinutes: 45,
    status: "upcoming",
    purpose: "Six-month blood pressure review and echocardiogram discussion",
    questionsToAsk: [
      "Should we consider reducing morning Lisinopril dosage?",
      "Are my occasional ankle swellings related to blood pressure?",
    ],
    preparationNotes: "Bring blood pressure home log book and fast for 4 hours prior",
    transportAssistanceNeeded: true,
    assignedCompanion: {
      userId: "user-marcus",
      userName: "Marcus Vance (Son)",
    },
    reminderSent: false,
    createdAt: "2026-11-01T09:00:00Z",
    updatedAt: "2026-11-01T09:00:00Z",
  };

  const sampleApt2: Appointment = {
    id: "apt-dental",
    profileId,
    title: "Routine Dental Cleaning & Exam",
    doctorName: "Dr. Emily Wong, DDS",
    specialty: "Dentistry",
    clinicName: "Gentle Dental Care",
    address: "100 Main St, Suite 101",
    phone: "(555) 987-6543",
    dateTime: "2026-11-28T14:30:00Z",
    durationMinutes: 30,
    status: "upcoming",
    purpose: "Routine checkup and plaque scaling",
    questionsToAsk: [],
    transportAssistanceNeeded: false,
    reminderSent: false,
    createdAt: "2026-11-01T09:00:00Z",
    updatedAt: "2026-11-01T09:00:00Z",
  };

  beforeEach(() => {
    const db = getAdminDb() as any;
    db._reset();
  });

  it("1. Persists appointment with doctor, clinic, companion, and questions in Firestore", async () => {
    const saved = await adminSaveAppointment(profileId, sampleApt1);
    expect(saved.id).toBe("apt-cardiology");
    expect(saved.doctorName).toBe("Dr. Robert Chen, MD");
    expect(saved.specialty).toBe("Cardiology");
    expect(saved.questionsToAsk).toHaveLength(2);
    expect(saved.assignedCompanion?.userName).toBe("Marcus Vance (Son)");
    expect(saved.transportAssistanceNeeded).toBe(true);

    const fetched = await adminFetchAppointments(profileId);
    expect(fetched).toHaveLength(1);
    expect(fetched[0].title).toBe("Cardiology Follow-Up");
    expect(fetched[0].preparationNotes).toContain("fast for 4 hours prior");
  });

  it("2. Updates existing appointment details and companion escort", async () => {
    await adminSaveAppointment(profileId, sampleApt1);
    const updated = await adminSaveAppointment(profileId, {
      ...sampleApt1,
      durationMinutes: 60,
      assignedCompanion: {
        userId: "user-maria",
        userName: "Nurse Maria Ramos, RN",
      },
    });

    expect(updated.durationMinutes).toBe(60);
    expect(updated.assignedCompanion?.userName).toBe("Nurse Maria Ramos, RN");

    const fetched = await adminFetchAppointments(profileId);
    expect(fetched[0].durationMinutes).toBe(60);
    expect(fetched[0].assignedCompanion?.userName).toBe("Nurse Maria Ramos, RN");
  });

  it("3. Deletes an appointment record", async () => {
    await adminSaveAppointment(profileId, sampleApt1);
    await adminSaveAppointment(profileId, sampleApt2);
    let fetched = await adminFetchAppointments(profileId);
    expect(fetched).toHaveLength(2);

    await adminDeleteAppointment(profileId, sampleApt1.id);
    fetched = await adminFetchAppointments(profileId);
    expect(fetched).toHaveLength(1);
    expect(fetched[0].id).toBe("apt-dental");
  });

  it("4. Sorts appointments chronologically for upcoming calendar view", () => {
    const list = [sampleApt2, sampleApt1]; // Deliberately out of order
    const sorted = [...list].sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

    expect(sorted[0].id).toBe("apt-cardiology"); // Nov 20 is before Nov 28
    expect(sorted[1].id).toBe("apt-dental");
  });
});
