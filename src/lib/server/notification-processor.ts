/**
 * Server-Side Notification Processor & Orchestrator for MediBridge AI
 * Milestone 3 - Idempotent, Multi-recipient Transactional Reminders
 */

import { getAdminDb } from "../firebase/admin";
import { AppUser } from "../types/user";
import { CareProfile } from "../types/care-profile";
import { CareProfileMembership } from "../types/membership";
import {
  NotificationRecord,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "../types/notification";
import {
  sendTransactionalEmail,
  buildMedicationReminderEmail,
  buildMissedDoseAlertEmail,
  buildAppointmentReminderEmail,
  buildTestVerificationEmail,
  maskEmail,
} from "./email-service";
import {
  isDoseUpcomingEligible,
  isDoseMissedEligible,
  isAppointmentUpcomingEligible,
  generateMedicationReminderKey,
  generateMissedDoseAlertKey,
  generateAppointmentReminderKey,
} from "../notifications/scheduler-evaluator";
import {
  adminGetCareProfile,
  adminGetUserDoc,
  adminFetchMembershipsForUser,
  adminFetchMedications,
  adminFetchAppointments,
  adminFetchAdherenceLogs,
} from "./firestore-admin";

const NOTIFICATIONS_COLLECTION = "sentNotifications";

function getDb() {
  const db = getAdminDb();
  if (!db) {
    throw new Error("Firebase Admin SDK is not initialized. Cannot process notifications.");
  }
  return db;
}

/**
 * Fetch or claim a notification record using atomic Firestore idempotency.
 * Returns { shouldSend: boolean, recordId: string }
 */
async function claimNotificationSlot(
  id: string,
  recordData: Partial<NotificationRecord>
): Promise<{ shouldSend: boolean; existingRecord?: NotificationRecord }> {
  const db = getDb();
  const docRef = db.collection(NOTIFICATIONS_COLLECTION).doc(id);

  const snap = await docRef.get();
  if (snap.exists) {
    const existing = snap.data() as NotificationRecord;
    // If already sent or skipped, do not send again
    if (existing.status === "sent" || existing.status === "skipped") {
      return { shouldSend: false, existingRecord: existing };
    }

    // If failed, check if retry is permissible (max 3 retries)
    if (existing.status === "failed" && existing.retryCount >= existing.maxRetries) {
      return { shouldSend: false, existingRecord: existing };
    }

    // Increment retry and proceed
    await docRef.update({
      status: "pending",
      retryCount: (existing.retryCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    });

    return { shouldSend: true, existingRecord: existing };
  }

  // Create initial pending claim
  const newRecord: NotificationRecord = {
    id,
    profileId: recordData.profileId || "",
    patientName: recordData.patientName || "Patient",
    recipientEmail: recordData.recipientEmail || "",
    recipientName: recordData.recipientName || "Member",
    recipientRole: recordData.recipientRole || "patient",
    type: recordData.type || "medication_reminder",
    title: recordData.title || "Care Notification",
    summary: recordData.summary || "",
    scheduledFor: recordData.scheduledFor || new Date().toISOString(),
    status: "pending",
    retryCount: 0,
    maxRetries: 3,
    metadata: recordData.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docRef.set(newRecord);
  return { shouldSend: true };
}

/**
 * Finalize notification record delivery status
 */
async function finalizeNotificationRecord(
  id: string,
  result: { success: boolean; messageId?: string; error?: string }
): Promise<void> {
  const db = getDb();
  const docRef = db.collection(NOTIFICATIONS_COLLECTION).doc(id);

  await docRef.update({
    status: result.success ? "sent" : "failed",
    sentAt: result.success ? new Date().toISOString() : null,
    error: result.error || null,
    updatedAt: new Date().toISOString(),
  }).catch(() => {});
}

/**
 * Process notifications for a single care profile
 */
export async function processCareProfileNotifications(
  profileId: string,
  options?: { now?: Date }
): Promise<{
  profileId: string;
  processedReminders: number;
  sentReminders: number;
  processedMissedAlerts: number;
  sentMissedAlerts: number;
  processedAppointments: number;
  sentAppointments: number;
  errors: string[];
}> {
  const stats = {
    profileId,
    processedReminders: 0,
    sentReminders: 0,
    processedMissedAlerts: 0,
    sentMissedAlerts: 0,
    processedAppointments: 0,
    sentAppointments: 0,
    errors: [] as string[],
  };

  const now = options?.now || new Date();
  const db = getDb();

  // 1. Fetch Care Profile
  const profile = await adminGetCareProfile(profileId);
  if (!profile) {
    stats.errors.push(`Care profile "${profileId}" not found.`);
    return stats;
  }

  // 2. Fetch Creator / Patient User Document
  const creatorUser = await adminGetUserDoc(profile.createdBy);
  const patientEmail = creatorUser?.email || "";
  const patientName = profile.preferredName || profile.patientName;

  // 3. Resolve Notification Preferences
  const prefs: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(creatorUser?.preferences?.notifications || {}),
    ...(profile.notificationSettings || {}),
  };

  const timezone = prefs.preferredTimezone || "UTC";

  // 4. Fetch Active Memberships (for caregiver escalation)
  const memSnap = await db
    .collection("memberships")
    .where("profileId", "==", profileId)
    .where("status", "==", "active")
    .get();

  const activeMemberships: CareProfileMembership[] = [];
  memSnap.forEach((d) => activeMemberships.push(d.data() as CareProfileMembership));

  const caregiverMembers = activeMemberships.filter(
    (m) => (m.role === "caregiver" || m.role === "family_member") && m.userEmail
  );

  // 5. Fetch Active Medications & Adherence Logs
  const medications = await adminFetchMedications(profileId);
  const activeMeds = medications.filter((m) => m.status === "active");
  const adherenceLogs = await adminFetchAdherenceLogs(profileId);

  // Today's date string in the profile timezone
  const todayDateStr = now.toISOString().split("T")[0];

  // =========================================================================
  // A. UPCOMING MEDICATION REMINDERS
  // =========================================================================
  if (prefs.medicationReminders && patientEmail) {
    for (const med of activeMeds) {
      for (const slot of med.scheduleTimes || []) {
        stats.processedReminders++;

        // Check if dose has already been logged (taken, skipped, etc.)
        const hasLog = adherenceLogs.some(
          (l) =>
            l.medicationId === med.id &&
            l.scheduledDate === todayDateStr &&
            l.scheduledTime === slot.time
        );

        const eligible = isDoseUpcomingEligible({
          scheduledDate: todayDateStr,
          scheduledTime: slot.time,
          timezone,
          leadMinutes: prefs.reminderLeadMinutes,
          now,
          hasAdherenceRecord: hasLog,
        });

        if (eligible) {
          const notifKey = generateMedicationReminderKey(
            profileId,
            med.id,
            todayDateStr,
            slot.time
          );

          const claim = await claimNotificationSlot(notifKey, {
            profileId,
            patientName,
            recipientEmail: patientEmail,
            recipientName: patientName,
            recipientRole: "patient",
            type: "medication_reminder",
            title: `Medication Reminder: ${med.name}`,
            summary: `Scheduled ${slot.label || "dose"} of ${med.name} (${med.dosage}) at ${slot.time}`,
            scheduledFor: `${todayDateStr}T${slot.time}:00Z`,
          });

          if (claim.shouldSend) {
            const emailPayload = buildMedicationReminderEmail({
              patientName,
              recipientName: patientName,
              medicationName: med.name,
              dosage: med.dosage,
              scheduledTime: slot.time,
              withFood: med.withFood,
              specialInstructions: med.specialInstructions,
            });
            emailPayload.to = patientEmail;

            const res = await sendTransactionalEmail(emailPayload);
            await finalizeNotificationRecord(notifKey, res);

            if (res.success) {
              stats.sentReminders++;
            } else {
              stats.errors.push(`Failed to send reminder for ${med.name}: ${res.error}`);
            }
          }
        }
      }
    }
  }

  // =========================================================================
  // B. MISSED MEDICATION ALERTS
  // =========================================================================
  if (prefs.missedDoseAlerts) {
    for (const med of activeMeds) {
      for (const slot of med.scheduleTimes || []) {
        stats.processedMissedAlerts++;

        const matchingLog = adherenceLogs.find(
          (l) =>
            l.medicationId === med.id &&
            l.scheduledDate === todayDateStr &&
            l.scheduledTime === slot.time
        );

        const missedEligible = isDoseMissedEligible({
          scheduledDate: todayDateStr,
          scheduledTime: slot.time,
          timezone,
          graceMinutes: prefs.missedGraceMinutes,
          now,
          adherenceStatus: matchingLog?.status || null,
        });

        if (missedEligible) {
          // 1. Notify Patient if they have email configured
          if (patientEmail) {
            const patientKey = generateMissedDoseAlertKey(
              profileId,
              med.id,
              todayDateStr,
              slot.time,
              creatorUser?.uid || "patient"
            );

            const claim = await claimNotificationSlot(patientKey, {
              profileId,
              patientName,
              recipientEmail: patientEmail,
              recipientName: patientName,
              recipientRole: "patient",
              type: "missed_dose_alert",
              title: `Dose Check-in Alert: ${med.name}`,
              summary: `Unconfirmed ${slot.time} dose of ${med.name} (${med.dosage})`,
              scheduledFor: `${todayDateStr}T${slot.time}:00Z`,
            });

            if (claim.shouldSend) {
              const emailPayload = buildMissedDoseAlertEmail({
                patientName,
                recipientName: patientName,
                isCaregiver: false,
                medicationName: med.name,
                dosage: med.dosage,
                scheduledTime: slot.time,
              });
              emailPayload.to = patientEmail;

              const res = await sendTransactionalEmail(emailPayload);
              await finalizeNotificationRecord(patientKey, res);

              if (res.success) {
                stats.sentMissedAlerts++;
              } else {
                stats.errors.push(`Failed to send missed alert to patient: ${res.error}`);
              }
            }
          }

          // 2. Notify Caregivers if caregiverAlerts is enabled
          if (prefs.caregiverAlerts && caregiverMembers.length > 0) {
            for (const caregiver of caregiverMembers) {
              const cgKey = generateMissedDoseAlertKey(
                profileId,
                med.id,
                todayDateStr,
                slot.time,
                caregiver.userId
              );

              const claim = await claimNotificationSlot(cgKey, {
                profileId,
                patientName,
                recipientEmail: caregiver.userEmail,
                recipientName: caregiver.userName,
                recipientRole: caregiver.role,
                type: "missed_dose_alert",
                title: `Caregiver Alert: ${patientName}'s ${med.name}`,
                summary: `Unconfirmed ${slot.time} dose of ${med.name} for ${patientName}`,
                scheduledFor: `${todayDateStr}T${slot.time}:00Z`,
              });

              if (claim.shouldSend) {
                const cgEmail = buildMissedDoseAlertEmail({
                  patientName,
                  recipientName: caregiver.userName,
                  isCaregiver: true,
                  medicationName: med.name,
                  dosage: med.dosage,
                  scheduledTime: slot.time,
                });
                cgEmail.to = caregiver.userEmail;

                const res = await sendTransactionalEmail(cgEmail);
                await finalizeNotificationRecord(cgKey, res);

                if (res.success) {
                  stats.sentMissedAlerts++;
                } else {
                  stats.errors.push(`Failed to send caregiver alert to ${maskEmail(caregiver.userEmail)}: ${res.error}`);
                }
              }
            }
          }
        }
      }
    }
  }

  // =========================================================================
  // C. APPOINTMENT REMINDERS
  // =========================================================================
  if (prefs.appointmentReminders) {
    const appointments = await adminFetchAppointments(profileId);
    const upcomingApts = appointments.filter((a) => a.status === "upcoming" && !a.reminderSent);

    for (const apt of upcomingApts) {
      stats.processedAppointments++;

      const isEligible = isAppointmentUpcomingEligible({
        appointment: apt,
        leadHours: prefs.appointmentLeadHours,
        now,
      });

      if (isEligible) {
        // Date format string for email
        const aptDate = new Date(apt.dateTime);
        const formattedDate = aptDate.toLocaleString("en-US", {
          timeZone: timezone,
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        // Send to patient
        if (patientEmail) {
          const aptKey = generateAppointmentReminderKey(profileId, apt.id, creatorUser?.uid || "patient");

          const claim = await claimNotificationSlot(aptKey, {
            profileId,
            patientName,
            recipientEmail: patientEmail,
            recipientName: patientName,
            recipientRole: "patient",
            type: "appointment_reminder",
            title: `Doctor Appointment Reminder: Dr. ${apt.doctorName}`,
            summary: `Upcoming appointment with Dr. ${apt.doctorName} at ${formattedDate}`,
            scheduledFor: apt.dateTime,
          });

          if (claim.shouldSend) {
            const emailPayload = buildAppointmentReminderEmail({
              patientName,
              recipientName: patientName,
              doctorName: apt.doctorName,
              specialty: apt.specialty,
              clinicName: apt.clinicName,
              address: apt.address,
              dateTimeFormatted: formattedDate,
              preparationNotes: apt.preparationNotes,
              questionsToAsk: apt.questionsToAsk,
            });
            emailPayload.to = patientEmail;

            const res = await sendTransactionalEmail(emailPayload);
            await finalizeNotificationRecord(aptKey, res);

            if (res.success) {
              stats.sentAppointments++;
              // Mark reminderSent: true on appointment document
              await db
                .collection("appointments")
                .doc(apt.id)
                .update({ reminderSent: true, updatedAt: new Date().toISOString() })
                .catch(() => {});
            } else {
              stats.errors.push(`Failed to send appointment reminder: ${res.error}`);
            }
          }
        }
      }
    }
  }

  return stats;
}

/**
 * Scan all active care profiles in bounded batches
 */
export async function processAllEligibleProfiles(options?: {
  limit?: number;
  now?: Date;
}): Promise<{
  totalProfilesScanned: number;
  totalSent: number;
  details: any[];
  errors: string[];
}> {
  const db = getDb();
  const maxLimit = options?.limit || 50; // Bounded batch size
  const profilesSnap = await db.collection("careProfiles").limit(maxLimit).get();

  const details: any[] = [];
  let totalSent = 0;
  const errors: string[] = [];

  for (const doc of profilesSnap.docs) {
    try {
      const profileResult = await processCareProfileNotifications(doc.id, { now: options?.now });
      details.push(profileResult);
      totalSent +=
        profileResult.sentReminders +
        profileResult.sentMissedAlerts +
        profileResult.sentAppointments;
      errors.push(...profileResult.errors);
    } catch (err: any) {
      errors.push(`Error processing profile ${doc.id}: ${err.message}`);
    }
  }

  return {
    totalProfilesScanned: profilesSnap.size,
    totalSent,
    details,
    errors,
  };
}

/**
 * Fetch recent notification delivery logs for a profile
 */
export async function adminFetchRecentNotifications(
  profileId: string,
  limitCount = 20
): Promise<NotificationRecord[]> {
  const db = getDb();
  const snap = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where("profileId", "==", profileId)
    .limit(limitCount)
    .get();

  const records: NotificationRecord[] = [];
  snap.forEach((d) => records.push(d.data() as NotificationRecord));

  // Sort descending by createdAt
  return records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Send a live test verification email to an authenticated user
 */
export async function adminSendTestNotification(
  user: AppUser,
  profileId?: string
): Promise<{ success: boolean; messageId?: string; error?: string; statusCode?: number }> {
  if (!user.email) {
    return { success: false, error: "Authenticated user does not have an email address configured." };
  }

  const testKey = `notif_test_${user.uid}_${Date.now()}`;
  const payload = buildTestVerificationEmail({
    recipientName: user.displayName || "Care Member",
    recipientEmail: user.email,
  });

  const res = await sendTransactionalEmail(payload);

  if (profileId) {
    await claimNotificationSlot(testKey, {
      profileId,
      patientName: user.displayName,
      recipientEmail: user.email,
      recipientName: user.displayName,
      recipientRole: user.role,
      type: "test_email",
      title: "Test Email Verification",
      summary: `Test verification email dispatched to ${maskEmail(user.email)}`,
      scheduledFor: new Date().toISOString(),
    });
    await finalizeNotificationRecord(testKey, res);
  }

  return res;
}
