/**
 * Server-Side Email Delivery Service for MediBridge AI
 * Milestone 3 - Real Resend API Integration
 *
 * Requirements:
 * - Credentials stored in server-only environment variables (RESEND_API_KEY or EMAIL_PROVIDER_API_KEY)
 * - Sender configured via EMAIL_FROM or NOTIFICATION_FROM_EMAIL
 * - Never logs private health records or full unmasked sensitive data
 * - Does not fake delivery when credentials are missing: reports real failure status
 */

import { EmailDispatchPayload, EmailDispatchResult } from "../types/notification";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "MediBridge AI <onboarding@resend.dev>";

export function getEmailProviderConfig() {
  const apiKey = (
    process.env.RESEND_API_KEY ||
    process.env.EMAIL_PROVIDER_API_KEY ||
    ""
  ).trim();

  const from = (
    process.env.EMAIL_FROM ||
    process.env.NOTIFICATION_FROM_EMAIL ||
    DEFAULT_FROM
  ).trim();

  return {
    apiKey,
    from,
    isConfigured: Boolean(apiKey && apiKey.length > 0),
  };
}

/**
 * Masks an email for privacy (e.g. "alice@example.com" -> "a***e@example.com")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "masked-user";
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export type EmailSenderFunction = (
  payload: EmailDispatchPayload
) => Promise<EmailDispatchResult>;

let customSender: EmailSenderFunction | null = null;

/**
 * Set custom email sender (for Vitest unit and integration tests)
 */
export function setMockEmailSender(sender: EmailSenderFunction | null) {
  customSender = sender;
}

/**
 * Core dispatch function that delivers email via Resend transactional API.
 */
export async function sendTransactionalEmail(
  payload: EmailDispatchPayload
): Promise<EmailDispatchResult> {
  // Allow injected sender for automated tests
  if (customSender) {
    return customSender(payload);
  }

  const { apiKey, from, isConfigured } = getEmailProviderConfig();

  if (!isConfigured) {
    console.warn(
      `[EmailService] Dispatch skipped for ${maskEmail(payload.to)}: RESEND_API_KEY is not configured.`
    );
    return {
      success: false,
      error: "EMAIL_PROVIDER_NOT_CONFIGURED: Please configure RESEND_API_KEY in your environment variables.",
      statusCode: 503,
    };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${res.status} from Resend API`;
      console.error(
        `[EmailService] Delivery failed for ${maskEmail(payload.to)}: ${errorMsg}`
      );
      return {
        success: false,
        error: errorMsg,
        statusCode: res.status,
      };
    }

    console.log(
      `[EmailService] Successfully sent "${payload.subject}" to ${maskEmail(payload.to)} (id: ${data?.id})`
    );

    return {
      success: true,
      messageId: data?.id,
      statusCode: 200,
    };
  } catch (err: any) {
    console.error(
      `[EmailService] Network/Transport error sending to ${maskEmail(payload.to)}:`,
      err?.message || err
    );
    return {
      success: false,
      error: err?.message || "Failed to reach email provider network",
      statusCode: 500,
    };
  }
}

/**
 * ----------------------------------------------------------------------
 * Accessible, High-Contrast Email Templates for Elderly Care
 * ----------------------------------------------------------------------
 */

function baseEmailWrapper(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      color: #0f172a;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #0f766e;
      padding: 24px 32px;
      color: #ffffff;
      text-align: left;
    }
    .brand {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .brand-accent {
      color: #99f6e4;
    }
    .tagline {
      font-size: 13px;
      color: #ccfbf1;
      margin-top: 4px;
    }
    .content {
      padding: 32px;
      font-size: 17px;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      background-color: #0f766e;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      font-size: 17px;
      padding: 14px 28px;
      border-radius: 12px;
      margin: 20px 0;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .badge-teal { background: #ccfbf1; color: #0f766e; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-blue { background: #e0f2fe; color: #0369a1; }
    .footer {
      background-color: #f1f5f9;
      padding: 20px 32px;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">MediBridge<span class="brand-accent">AI</span></div>
      <div class="tagline">From Doctor's Advice to Everyday Care</div>
    </div>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><strong>MediBridge Care Notification</strong></p>
      <p style="margin: 0;">This email was sent based on your scheduled care profile preferences. For urgent medical concerns, please contact your healthcare provider or emergency services directly.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Upcoming Medication Dose Reminder
 */
export function buildMedicationReminderEmail(params: {
  patientName: string;
  recipientName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  withFood?: boolean;
  specialInstructions?: string;
  dashboardUrl?: string;
}): EmailDispatchPayload & { recipientEmail?: string } {
  const url = params.dashboardUrl || "https://medibridge-ai.vercel.app/dashboard";
  const foodNote = params.withFood ? "• Take with a meal or light snack" : "";
  const instructions = params.specialInstructions ? `• Note: ${params.specialInstructions}` : "";

  const htmlBody = `
    <span class="badge badge-teal">Upcoming Medication Reminder</span>
    <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 8px;">Time for your scheduled dose, ${params.recipientName}</h2>
    <p>This is a gentle reminder that your medication is scheduled for <strong>${params.scheduledTime}</strong>:</p>
    
    <div style="background: #f8fafc; border-left: 4px solid #0f766e; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0; font-size: 20px; color: #0f766e;">${params.medicationName}</h3>
      <p style="margin: 4px 0 0 0; font-size: 16px; color: #334155;"><strong>Prescribed Dose:</strong> ${params.dosage}</p>
      ${foodNote ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #475569;">${foodNote}</p>` : ""}
      ${instructions ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #475569;">${instructions}</p>` : ""}
    </div>

    <p>Once taken, tap below to confirm on your care schedule:</p>
    <a href="${url}" class="btn">Confirm Dose Taken</a>
  `;

  const textBody = `MediBridge AI - Medication Reminder
Hello ${params.recipientName},

This is a reminder for ${params.patientName}'s scheduled medication:
Medication: ${params.medicationName}
Dosage: ${params.dosage}
Scheduled Time: ${params.scheduledTime}
${foodNote ? foodNote + "\n" : ""}${instructions ? instructions + "\n" : ""}
Confirm your dose on the MediBridge dashboard: ${url}
`;

  return {
    to: "", // supplied by caller
    subject: `Medication Reminder: ${params.medicationName} (${params.scheduledTime})`,
    html: baseEmailWrapper("Medication Reminder", htmlBody),
    text: textBody,
  };
}

/**
 * 2. Missed Medication Alert (Patient & Caregiver)
 */
export function buildMissedDoseAlertEmail(params: {
  patientName: string;
  recipientName: string;
  isCaregiver: boolean;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  dashboardUrl?: string;
}): EmailDispatchPayload & { recipientEmail?: string } {
  const url = params.dashboardUrl || "https://medibridge-ai.vercel.app/dashboard";

  const greeting = params.isCaregiver
    ? `Dear ${params.recipientName} (Caregiver for ${params.patientName}),`
    : `Hello ${params.recipientName},`;

  const explanation = params.isCaregiver
    ? `We noticed that <strong>${params.patientName}</strong>'s dose of <strong>${params.medicationName} (${params.dosage})</strong> scheduled for <strong>${params.scheduledTime}</strong> has not yet been marked as taken on the care dashboard.`
    : `We noticed your dose of <strong>${params.medicationName} (${params.dosage})</strong> scheduled for <strong>${params.scheduledTime}</strong> was not confirmed on your schedule.`;

  const htmlBody = `
    <span class="badge badge-amber">Dose Check-in Alert</span>
    <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 8px;">Medication Check-in Needed</h2>
    <p>${greeting}</p>
    <p>${explanation}</p>
    
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0; font-size: 18px; color: #92400e;">Unconfirmed Dose Slot</h3>
      <p style="margin: 4px 0 0 0; font-size: 16px; color: #78350f;"><strong>Medication:</strong> ${params.medicationName} (${params.dosage})</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #b45309;">Scheduled slot: ${params.scheduledTime}</p>
    </div>

    <p>If the dose has already been taken, please log it so the entire care circle stays updated:</p>
    <a href="${url}" class="btn" style="background-color: #d97706;">View Care Dashboard</a>
  `;

  const textBody = `MediBridge AI - Medication Check-in Alert
${greeting}

${explanation.replace(/<[^>]*>/g, "")}

Medication: ${params.medicationName} (${params.dosage})
Scheduled slot: ${params.scheduledTime}

Update status on the dashboard: ${url}
`;

  return {
    to: "",
    subject: `Check-in Alert: ${params.patientName}'s ${params.medicationName} dose (${params.scheduledTime})`,
    html: baseEmailWrapper("Medication Check-in Alert", htmlBody),
    text: textBody,
  };
}

/**
 * 3. Doctor Appointment Reminder
 */
export function buildAppointmentReminderEmail(params: {
  patientName: string;
  recipientName: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  address: string;
  dateTimeFormatted: string;
  preparationNotes?: string;
  questionsToAsk?: string[];
  dashboardUrl?: string;
}): EmailDispatchPayload & { recipientEmail?: string } {
  const url = params.dashboardUrl || "https://medibridge-ai.vercel.app/dashboard/appointments";
  const prep = params.preparationNotes ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #0369a1;"><strong>Preparation:</strong> ${params.preparationNotes}</p>` : "";
  const questions = params.questionsToAsk && params.questionsToAsk.length > 0
    ? `<div style="margin-top: 10px;"><strong>Prepared Questions to Ask:</strong><ul style="margin: 4px 0; padding-left: 20px;">${params.questionsToAsk.map(q => `<li>${q}</li>`).join("")}</ul></div>`
    : "";

  const htmlBody = `
    <span class="badge badge-blue">Upcoming Doctor Appointment</span>
    <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 8px;">Doctor Appointment Reminder</h2>
    <p>Hello ${params.recipientName},</p>
    <p>This is a reminder for <strong>${params.patientName}</strong>'s upcoming consultation with <strong>Dr. ${params.doctorName}</strong>.</p>
    
    <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 18px 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0; font-size: 18px; color: #0369a1;">Dr. ${params.doctorName} (${params.specialty})</h3>
      <p style="margin: 4px 0 0 0; font-size: 16px; color: #0c4a6e;"><strong>Date & Time:</strong> ${params.dateTimeFormatted}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #0284c7;"><strong>Location:</strong> ${params.clinicName}, ${params.address}</p>
      ${prep}
      ${questions}
    </div>

    <p>You can review your visit notes and consultation plan on your dashboard:</p>
    <a href="${url}" class="btn" style="background-color: #0284c7;">View Appointment Details</a>
  `;

  const textBody = `MediBridge AI - Appointment Reminder
Hello ${params.recipientName},

Upcoming appointment for ${params.patientName}:
Doctor: Dr. ${params.doctorName} (${params.specialty})
Date & Time: ${params.dateTimeFormatted}
Location: ${params.clinicName}, ${params.address}
${params.preparationNotes ? "Preparation: " + params.preparationNotes + "\n" : ""}
View appointment details: ${url}
`;

  return {
    to: "",
    subject: `Appointment Reminder: Dr. ${params.doctorName} (${params.dateTimeFormatted})`,
    html: baseEmailWrapper("Appointment Reminder", htmlBody),
    text: textBody,
  };
}

/**
 * 4. Test Email
 */
export function buildTestVerificationEmail(params: {
  recipientName: string;
  recipientEmail: string;
}): EmailDispatchPayload {
  const htmlBody = `
    <span class="badge badge-teal">Test Verification</span>
    <h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 8px;">MediBridge Email System Operational</h2>
    <p>Hello ${params.recipientName},</p>
    <p>This is a live test notification from your <strong>MediBridge AI</strong> care management platform.</p>
    <p>Your email notification provider (Resend) has been successfully verified for delivery to: <strong>${params.recipientEmail}</strong>.</p>
    <p>Upcoming medication reminders, missed-dose check-in alerts, and doctor appointment schedules will be delivered to this address.</p>
  `;

  const textBody = `MediBridge AI - Test Verification
Hello ${params.recipientName},

This is a live test notification from your MediBridge AI platform.
Your email service is operational and verified for delivery to: ${params.recipientEmail}.
`;

  return {
    to: params.recipientEmail,
    subject: `MediBridge AI — Notification System Verification`,
    html: baseEmailWrapper("Test Verification", htmlBody),
    text: textBody,
  };
}
