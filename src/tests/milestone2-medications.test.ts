import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateTodaySchedule,
  calculateAdherenceStats,
  getLocalDateString,
} from "../lib/utils/adherence";
import { Medication, MedicationAdherenceLog } from "../lib/types/medication";
import {
  adminSaveMedication,
  adminFetchMedications,
  adminDeleteMedication,
  adminLogAdherenceDose,
  adminVerifyProfileAccess,
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

describe("Milestone 2 — Medication Management & Schedule Generation", () => {
  const profileId = "profile-eleanor-vance";

  const sampleMed1: Medication = {
    id: "med-lisinopril",
    profileId,
    name: "Lisinopril",
    genericName: "Lisinopril dihydrate",
    dosage: "20mg, 1 tablet",
    route: "Oral",
    frequency: "daily",
    scheduleTimes: [{ time: "08:00", label: "morning" }],
    withFood: true,
    specialInstructions: "Take with water every morning",
    prescribingDoctor: "Dr. Robert Chen, MD",
    prescribedFor: "Hypertension",
    status: "active",
    refillReminder: { enabled: true, remainingDoses: 28 },
    pillVisual: { color: "Pink", shape: "Round" },
    createdAt: "2026-11-01T08:00:00Z",
    updatedAt: "2026-11-01T08:00:00Z",
  };

  const sampleMed2: Medication = {
    id: "med-metformin",
    profileId,
    name: "Metformin",
    genericName: "Metformin HCl",
    dosage: "500mg, 1 tablet",
    route: "Oral",
    frequency: "twice_daily",
    scheduleTimes: [
      { time: "08:00", label: "morning" },
      { time: "20:00", label: "evening" },
    ],
    withFood: true,
    specialInstructions: "Take with food to avoid upset stomach",
    prescribingDoctor: "Dr. Sarah Jenkins, MD",
    prescribedFor: "Type 2 Diabetes",
    status: "active",
    refillReminder: { enabled: true, remainingDoses: 45 },
    pillVisual: { color: "White", shape: "Oval" },
    createdAt: "2026-11-01T08:00:00Z",
    updatedAt: "2026-11-01T08:00:00Z",
  };

  beforeEach(() => {
    const db = getAdminDb() as any;
    db._reset();
  });

  it("1. Persists medication records with dosage and schedule in Firestore", async () => {
    const saved = await adminSaveMedication(profileId, sampleMed1);
    expect(saved.id).toBe("med-lisinopril");
    expect(saved.name).toBe("Lisinopril");
    expect(saved.dosage).toBe("20mg, 1 tablet");
    expect(saved.scheduleTimes).toHaveLength(1);

    const fetched = await adminFetchMedications(profileId);
    expect(fetched).toHaveLength(1);
    expect(fetched[0].name).toBe("Lisinopril");
    expect(fetched[0].pillVisual?.color).toBe("Pink");
  });

  it("2. Updates existing medication record", async () => {
    await adminSaveMedication(profileId, sampleMed1);
    const updated = await adminSaveMedication(profileId, {
      ...sampleMed1,
      dosage: "40mg, 1 tablet",
      specialInstructions: "Increased dosage per Dr. Chen",
    });

    expect(updated.dosage).toBe("40mg, 1 tablet");
    const fetched = await adminFetchMedications(profileId);
    expect(fetched[0].dosage).toBe("40mg, 1 tablet");
    expect(fetched[0].specialInstructions).toBe("Increased dosage per Dr. Chen");
  });

  it("3. Deletes a medication record", async () => {
    await adminSaveMedication(profileId, sampleMed1);
    await adminSaveMedication(profileId, sampleMed2);
    let fetched = await adminFetchMedications(profileId);
    expect(fetched).toHaveLength(2);

    await adminDeleteMedication(profileId, sampleMed1.id);
    fetched = await adminFetchMedications(profileId);
    expect(fetched).toHaveLength(1);
    expect(fetched[0].id).toBe("med-metformin");
  });

  it("4. Dynamically generates today's medication schedule from active prescriptions", () => {
    const today = getLocalDateString();
    const todaySchedule = generateTodaySchedule([sampleMed1, sampleMed2], [], today);

    // Lisinopril has 1 time (08:00), Metformin has 2 times (08:00, 20:00) -> Total 3 doses
    expect(todaySchedule).toHaveLength(3);
    expect(todaySchedule[0].scheduledTime).toBe("08:00");
    expect(todaySchedule[1].scheduledTime).toBe("08:00");
    expect(todaySchedule[2].scheduledTime).toBe("20:00");

    // All should initially be pending
    expect(todaySchedule.every((d) => d.status === "pending")).toBe(true);
  });

  it("5. Merges logged adherence into today's dynamic schedule", () => {
    const today = getLocalDateString();
    const existingLog: MedicationAdherenceLog = {
      id: `adh_${profileId}_${sampleMed1.id}_${today}_0800`,
      profileId,
      medicationId: sampleMed1.id,
      medicationName: sampleMed1.name,
      dosage: sampleMed1.dosage,
      scheduledTime: "08:00",
      scheduledDate: today,
      status: "taken",
      loggedAt: `${today}T08:15:00Z`,
    };

    const todaySchedule = generateTodaySchedule([sampleMed1, sampleMed2], [existingLog], today);
    expect(todaySchedule).toHaveLength(3);

    const lisinoprilDose = todaySchedule.find((d) => d.medicationId === sampleMed1.id);
    expect(lisinoprilDose?.status).toBe("taken");

    const eveningMetformin = todaySchedule.find(
      (d) => d.medicationId === sampleMed2.id && d.scheduledTime === "20:00"
    );
    expect(eveningMetformin?.status).toBe("pending");
  });

  it("6. Supports 1-tap adherence statuses: Taken, Skipped, and Missed", async () => {
    const today = getLocalDateString();
    const user = { uid: "user-eleanor", displayName: "Eleanor Vance", role: "elderly_patient" };

    // Log taken
    const takenLog = await adminLogAdherenceDose(
      profileId,
      user as any,
      {
        medicationId: sampleMed1.id,
        medicationName: sampleMed1.name,
        dosage: sampleMed1.dosage,
        scheduledTime: "08:00",
        scheduledDate: today,
        status: "taken",
      }
    );
    expect(takenLog.status).toBe("taken");
    expect(takenLog.loggedBy?.userName).toBe("Eleanor Vance");

    // Log skipped
    const skippedLog = await adminLogAdherenceDose(
      profileId,
      user as any,
      {
        medicationId: sampleMed2.id,
        medicationName: sampleMed2.name,
        dosage: sampleMed2.dosage,
        scheduledTime: "08:00",
        scheduledDate: today,
        status: "skipped",
        notes: "Nausea this morning",
      }
    );
    expect(skippedLog.status).toBe("skipped");
    expect(skippedLog.notes).toBe("Nausea this morning");

    // Log missed
    const missedLog = await adminLogAdherenceDose(
      profileId,
      user as any,
      {
        medicationId: sampleMed2.id,
        medicationName: sampleMed2.name,
        dosage: sampleMed2.dosage,
        scheduledTime: "20:00",
        scheduledDate: today,
        status: "missed",
      }
    );
    expect(missedLog.status).toBe("missed");
  });

  it("7. Prevents duplicate adherence entries via deterministic slot IDs", async () => {
    const today = getLocalDateString();
    const user = { uid: "user-eleanor", displayName: "Eleanor Vance", role: "elderly_patient" };

    // Tap 1: Mark taken
    const log1 = await adminLogAdherenceDose(
      profileId,
      user as any,
      {
        medicationId: sampleMed1.id,
        medicationName: sampleMed1.name,
        dosage: sampleMed1.dosage,
        scheduledTime: "08:00",
        scheduledDate: today,
        status: "taken",
      }
    );

    // Tap 2 (rapid re-tap or change of status to skipped)
    const log2 = await adminLogAdherenceDose(
      profileId,
      user as any,
      {
        medicationId: sampleMed1.id,
        medicationName: sampleMed1.name,
        dosage: sampleMed1.dosage,
        scheduledTime: "08:00",
        scheduledDate: today,
        status: "skipped",
      }
    );

    // Deterministic ID must be identical: no duplicate docs created
    expect(log1.id).toBe(log2.id);
    expect(log2.status).toBe("skipped");

    const db = getAdminDb() as any;
    const allAdherenceDocs = db._store.get("adherenceLogs");
    expect(allAdherenceDocs.size).toBe(1);
  });

  it("8. Computes accurate daily, weekly, and streak adherence statistics", () => {
    const today = getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const logs: MedicationAdherenceLog[] = [
      // Today: 1 taken, 1 skipped, 1 pending
      {
        id: "l1",
        profileId,
        medicationId: sampleMed1.id,
        medicationName: sampleMed1.name,
        dosage: sampleMed1.dosage,
        scheduledTime: "08:00",
        scheduledDate: today,
        status: "taken",
      },
      {
        id: "l2",
        profileId,
        medicationId: sampleMed2.id,
        medicationName: sampleMed2.name,
        dosage: sampleMed2.dosage,
        scheduledTime: "08:00",
        scheduledDate: today,
        status: "skipped",
      },
      // Yesterday: taken
      {
        id: "l3",
        profileId,
        medicationId: sampleMed1.id,
        medicationName: sampleMed1.name,
        dosage: sampleMed1.dosage,
        scheduledTime: "08:00",
        scheduledDate: yesterdayStr,
        status: "taken",
      },
    ];

    const stats = calculateAdherenceStats([sampleMed1, sampleMed2], logs, today);
    expect(stats.todayTotal).toBe(3); // Lisinopril (1) + Metformin (2)
    expect(stats.todayTaken).toBe(1);
    expect(stats.todaySkipped).toBe(1);
    expect(stats.todayPending).toBe(1);
    expect(stats.todayRate).toBe(33); // 1 / 3 = 33%
    expect(stats.streakDays).toBeGreaterThanOrEqual(1);
  });
});
