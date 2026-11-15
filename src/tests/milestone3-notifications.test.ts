import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  maskEmail,
  getEmailProviderConfig,
  sendTransactionalEmail,
  setMockEmailSender,
  buildMedicationReminderEmail,
  buildMissedDoseAlertEmail,
  buildAppointmentReminderEmail,
  buildTestVerificationEmail,
} from "../lib/server/email-service";
import { POST as processRouteHandler } from "../app/api/notifications/process/route";

describe("Milestone 3 — Email Delivery & Security Tests", () => {
  beforeEach(() => {
    setMockEmailSender(null);
    vi.restoreAllMocks();
  });

  describe("1. Email Privacy & Log Sanitization", () => {
    it("masks email addresses to prevent exposing health identifiers in logs", () => {
      expect(maskEmail("alice@example.com")).toBe("a***e@example.com");
      expect(maskEmail("bob.smith@gmail.com")).toBe("b***h@gmail.com");
      expect(maskEmail("me@care.org")).toBe("m***@care.org");
      expect(maskEmail("invalid-email")).toBe("masked-user");
    });

    it("reads email configuration without throwing when unconfigured", () => {
      const config = getEmailProviderConfig();
      expect(typeof config.from).toBe("string");
      expect(typeof config.isConfigured).toBe("boolean");
    });
  });

  describe("2. Email Templates & Content Safety", () => {
    it("builds clear medication reminder email with calm guidance", () => {
      const email = buildMedicationReminderEmail({
        patientName: "Alice Vance",
        recipientName: "Alice",
        medicationName: "Lisinopril",
        dosage: "10mg",
        scheduledTime: "08:00 AM",
        withFood: true,
        specialInstructions: "Take with full glass of water",
      });

      expect(email.subject).toContain("Lisinopril");
      expect(email.subject).toContain("08:00 AM");
      expect(email.html).toContain("Time for your scheduled dose, Alice");
      expect(email.html).toContain("Lisinopril");
      expect(email.html).toContain("Take with a meal or light snack");
      expect(email.text).toContain("Confirm your dose");
    });

    it("builds caregiver-specific missed dose alert with clear context", () => {
      const email = buildMissedDoseAlertEmail({
        patientName: "Alice Vance",
        recipientName: "Nurse Susan",
        isCaregiver: true,
        medicationName: "Metformin",
        dosage: "500mg",
        scheduledTime: "12:00 PM",
      });

      expect(email.subject).toContain("Check-in Alert");
      expect(email.subject).toContain("Alice Vance");
      expect(email.html).toContain("Nurse Susan (Caregiver for Alice Vance)");
      expect(email.html).toContain("has not yet been marked as taken");
    });

    it("builds patient-safe missed dose alert without accusatory language", () => {
      const email = buildMissedDoseAlertEmail({
        patientName: "Alice Vance",
        recipientName: "Alice",
        isCaregiver: false,
        medicationName: "Metformin",
        dosage: "500mg",
        scheduledTime: "12:00 PM",
      });

      expect(email.html).toContain("Hello Alice");
      expect(email.html).toContain("was not confirmed on your schedule");
    });

    it("builds appointment reminder with preparation notes and questions list", () => {
      const email = buildAppointmentReminderEmail({
        patientName: "Alice Vance",
        recipientName: "Alice",
        doctorName: "Sarah Jenkins",
        specialty: "Cardiology",
        clinicName: "Metro Heart Clinic",
        address: "100 Medical Blvd",
        dateTimeFormatted: "Mon, Nov 23 at 10:00 AM",
        preparationNotes: "Bring previous ECG report",
        questionsToAsk: ["Should I adjust morning dose?", "When is next follow-up?"],
      });

      expect(email.subject).toContain("Dr. Sarah Jenkins");
      expect(email.html).toContain("Dr. Sarah Jenkins (Cardiology)");
      expect(email.html).toContain("Bring previous ECG report");
      expect(email.html).toContain("Should I adjust morning dose?");
    });

    it("builds test verification email", () => {
      const email = buildTestVerificationEmail({
        recipientName: "Alice",
        recipientEmail: "alice@example.com",
      });

      expect(email.to).toBe("alice@example.com");
      expect(email.subject).toContain("MediBridge AI");
      expect(email.html).toContain("MediBridge Email System Operational");
    });
  });

  describe("3. Email Delivery & Error Handling", () => {
    it("reports failure when RESEND_API_KEY is missing (never fakes delivery)", async () => {
      const originalKey = process.env.RESEND_API_KEY;
      const originalProviderKey = process.env.EMAIL_PROVIDER_API_KEY;

      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_PROVIDER_API_KEY;

      try {
        const result = await sendTransactionalEmail({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>",
          text: "Test",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("EMAIL_PROVIDER_NOT_CONFIGURED");
        expect(result.statusCode).toBe(503);
      } finally {
        if (originalKey) process.env.RESEND_API_KEY = originalKey;
        if (originalProviderKey) process.env.EMAIL_PROVIDER_API_KEY = originalProviderKey;
      }
    });

    it("dispatches using injected test sender in mocked test environments", async () => {
      const mockSender = vi.fn().mockResolvedValue({
        success: true,
        messageId: "mock-msg-12345",
        statusCode: 200,
      });

      setMockEmailSender(mockSender);

      const result = await sendTransactionalEmail({
        to: "patient@example.com",
        subject: "Scheduled Reminder",
        html: "<p>Reminder</p>",
        text: "Reminder",
      });

      expect(mockSender).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe("mock-msg-12345");
    });

    it("handles delivery failure from provider cleanly", async () => {
      const mockSender = vi.fn().mockResolvedValue({
        success: false,
        error: "Domain not verified on Resend",
        statusCode: 403,
      });

      setMockEmailSender(mockSender);

      const result = await sendTransactionalEmail({
        to: "patient@example.com",
        subject: "Scheduled Reminder",
        html: "<p>Reminder</p>",
        text: "Reminder",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Domain not verified on Resend");
      expect(result.statusCode).toBe(403);
    });
  });

  describe("4. Scheduler Processor Endpoint Security", () => {
    it("rejects unauthenticated requests with 401 Unauthorized (missing token)", async () => {
      process.env.CRON_SECRET = "test-cron-secret-12345";

      const req = new Request("http://localhost:3000/api/notifications/process", {
        method: "POST",
      });

      const res = await processRouteHandler(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.code).toBe("UNAUTHORIZED_SCHEDULER");
    });

    it("rejects requests with incorrect bearer token (401 Unauthorized)", async () => {
      process.env.CRON_SECRET = "test-cron-secret-12345";

      const req = new Request("http://localhost:3000/api/notifications/process", {
        method: "POST",
        headers: {
          Authorization: "Bearer wrong-secret-value",
        },
      });

      const res = await processRouteHandler(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.code).toBe("UNAUTHORIZED_SCHEDULER");
    });

    it("fails with 503 if CRON_SECRET is unconfigured on the server", async () => {
      const originalSecret = process.env.CRON_SECRET;
      delete process.env.CRON_SECRET;
      delete process.env.NOTIFICATION_PROCESSOR_SECRET;

      try {
        const req = new Request("http://localhost:3000/api/notifications/process", {
          method: "POST",
          headers: {
            Authorization: "Bearer any-secret",
          },
        });

        const res = await processRouteHandler(req);
        const data = await res.json();

        expect(res.status).toBe(503);
        expect(data.code).toBe("CRON_SECRET_UNCONFIGURED");
      } finally {
        if (originalSecret) process.env.CRON_SECRET = originalSecret;
      }
    });
  });
});
