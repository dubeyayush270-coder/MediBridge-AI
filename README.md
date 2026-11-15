# MediBridge AI

> **From Doctor's Advice to Everyday Care**  
> *Catalyst 2026 — PromptWars Hackathon Submission*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20Production-teal?style=for-the-badge&logo=vercel)](https://medi-bridge-ai-ruddy.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-navy?style=for-the-badge&logo=github)](https://github.com/dubeyayush270-coder/MediBridge-AI)
[![Tests Passing](https://img.shields.io/badge/Vitest-128%20Passed-brightgreen?style=for-the-badge&logo=vitest)](https://github.com/dubeyayush270-coder/MediBridge-AI)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25%20Strict-blue?style=for-the-badge&logo=typescript)](https://github.com/dubeyayush270-coder/MediBridge-AI)

---

## 🌐 Live Application & Links

- **Live Production URL**: [https://medi-bridge-ai-ruddy.vercel.app/](https://medi-bridge-ai-ruddy.vercel.app/)
- **GitHub Repository**: [https://github.com/dubeyayush270-coder/MediBridge-AI](https://github.com/dubeyayush270-coder/MediBridge-AI)
- **Latest Production Commit**: [`b0e8764`](https://github.com/dubeyayush270-coder/MediBridge-AI/commit/b0e876472d250811eef4539ef510255c2763f3ce)

---

## 📌 Project Overview

Managing health in older age is daunting. After visiting a clinic, an elderly patient often leaves with handwritten notes, complex dosage schedules, multi-drug regimens with competing food requirements, and follow-up dates scattered across paper cards. 

Three critical bottlenecks compromise elderly wellness:
1. **Medication Non-Adherence**: Confusion over dosage timings, generic vs. brand names, and food restrictions leads to skipped or accidental double doses.
2. **Missed Clinical Consultations**: Transportation challenges, lack of companions, and forgotten appointments result in lapsed care and emergency readmissions.
3. **Fragmented Family Coordination**: Family members and designated caregivers want to help, but lack real-time visibility into whether today's morning medications were actually taken.

---

## 💡 Our Solution

**MediBridge AI** bridges the gap from doctor's advice to everyday home care. It provides an accessible, high-contrast healthcare companion and caregiver coordination platform designed specifically for seniors and their support circles.

Key pillars of MediBridge AI:
- **Elder-Centric Accessibility**: Designed with high-contrast color palettes (`#0F1A2F` on `#FAF9F5`), large typography, generous 56px+ touch targets, and zero sensory overload.
- **Dose & Regimen Clarity**: 1-tap adherence tracking (Taken, Skipped, Missed), visual appearance cues, meal instructions, and refill reminders.
- **Doctor Consultation Management**: Complete clinical visit tracking, preparation notes, companion escort assignments, and transportation assistance requests.
- **Passcode Care Circles**: Seniors can invite family members and caregivers with 6-character, high-readability passcodes—no complicated OAuth permissions required for elders.
- **Reliable Notification Engine**: Timezone-aware email reminders, missed dose escalations to caregivers, and upcoming appointment notices powered by Resend.

---

## ✨ Core Implemented Features

Every feature listed below is fully implemented and tested in the codebase:

### 1. Account & Authentication Security
- **Email & Password Authentication**: Full user registration, login, and session persistence using Firebase Authentication.
- **Protected Server-Side User Profiles**: User documents and roles are managed server-side via Firebase Admin SDK with automatic token verification (`verifyIdToken`).
- **Instant Demo Evaluation Mode**: Automatic fallback for evaluators to test all features with fictional data if Firebase credentials are not configured locally.

### 2. Elderly Care Profiles
- **Dedicated Health Profiles**: Supports patient name, preferred name, date of birth, blood type, primary condition notes, allergies, and emergency contacts.
- **Profile Switching**: Users can switch between managed care profiles seamlessly from the dashboard.

### 3. Role-Based Family & Caregiver Collaboration
- **Strict Role-Based Access Control (RBAC)**: Support for `elderly_patient`, `family_member`, and `caregiver` roles with least-privilege permission sets (`ROLE_PERMISSIONS`).
- **Care Circle Directory**: View all active members, their relationship to the patient, and their assigned roles.

### 4. Passcode-Based Care-Circle Invitations
- **Elder-Friendly Passcodes**: Generates 6-character unambiguous invitation codes (e.g., `CARE26`).
- **Cryptographic Security**: Passcodes are hashed with unique 16-byte random salts using SHA-256 before storage.
- **Brute-Force & Expiration Defenses**: Automatic 48-hour expiration, 5-attempt lockdown threshold, and atomic single-use redemption via Firestore transactions.

### 5. Medication Management (Full CRUD)
- **Create**: Record medication name, generic name, prescribed dosage strength, administration route, frequency, schedule times, meal instructions (with food / empty stomach), refill alerts, and prescribing doctor.
- **View**: Dual-view interface toggles between "Today's Schedule" and "All Prescribed Regimens".
- **Edit**: Edit existing medication regimens with pre-populated dialogs via protected `PATCH` API routes.
- **Delete**: Remove discontinued medications with inline confirmation dialogs.

### 6. 1-Tap Adherence Tracking
- **Daily Doses**: Today's schedule dynamically computed based on prescription frequencies and local timezones.
- **Status Logging**: Big 56px+ buttons to record doses as **Taken**, **Skipped**, or **Missed**.
- **Status Corrections**: Easily change a dose from Skipped back to Taken if taken later.
- **Deduplication Engine**: Uses deterministic document IDs (`adh_{profileId}_{medicationId}_{date}_{time}`) and atomic checks to prevent duplicate records.

### 7. Adherence Analytics & Statistics
- **Daily Progress**: Real-time counter of taken vs. scheduled doses for today.
- **Weekly Adherence Rates**: Computed percentage adherence across recent logs with visual progress indicators and motivational feedback.

### 8. Doctor Appointment Management (Full CRUD)
- **Create**: Schedule consultations with title, doctor name, medical specialty, clinic name, street address, phone number, date/time, and duration.
- **View**: Chronological appointment cards detailing doctor specialty, clinic address with 1-tap phone dialing, preparation instructions, questions to ask, and transport status.
- **Edit**: Update appointment details, companion assignments, or preparation notes via protected `PATCH` API routes.
- **Delete**: Cancel upcoming consultations with confirmation dialogs.

### 9. Accessible Elderly-Friendly Dashboard
- **Visual Design**: High-contrast, glare-free color palette meeting WCAG accessibility recommendations.
- **Large Touch Targets**: All primary action buttons meet or exceed the 56px touch target threshold.
- **Printable Routine Sheet**: Print-ready daily view formatted for home refrigerators.

### 10. Notification Preferences
- **Granular Controls**: Toggles for upcoming dose reminders, missed dose alerts, and caregiver escalation.
- **Custom Windows**: Configurable reminder lead times (15–60 mins) and missed dose grace periods (30–120 mins).
- **Timezone Awareness**: Configurable local timezone selection (e.g., `America/New_York`, `Asia/Kolkata`) for accurate scheduling math.

### 11. Timezone-Aware Notification Scheduler Engine
- **Pure Evaluation Math**: Pure functions convert local wall-clock times to UTC to calculate reminder eligibility without drift.
- **Upcoming Medication Reminders**: Identifies upcoming doses within the active lead window.
- **Missed Dose Alerts**: Detects untaken doses after the grace period has elapsed.
- **Appointment Reminders**: Evaluates appointments scheduled within 24 hours.

### 12. Transactional Email Integration (Resend)
- **Email Service**: Reusable dispatch module (`email-service.ts`) communicating with the Resend API (`POST https://api.resend.com/emails`).
- **High-Contrast Templates**: Accessible HTML and plaintext templates for dose reminders, missed alerts, appointment notices, and test verifications.
- **Privacy Masking**: Automatically masks email addresses in server logs (e.g., `j***e@example.com`) to protect personal health details.

### 13. Idempotency & Deduplication Engine
- **Atomic Document Claims**: Claims deterministic documents in Firestore `sentNotifications` before dispatching emails.
- **Retry Safety**: Prevents duplicate emails across concurrent scheduler runs or network retries.

### 14. Protected Notification Processor Endpoint
- **Dual HTTP Method Support**: Implements both `GET` (required by Vercel Scheduled Cron) and `POST` (used by external schedulers and manual triggers) on `/api/notifications/process`.
- **Security Guard**: Strictly enforces `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret` header. Rejects unauthorized invocations with HTTP 401 and unconfigured environments with HTTP 503.
- **On-Demand "Check Alerts Now"**: Authenticated dashboard trigger allowing immediate notification evaluation for the active care profile.

---

## 🏗️ Technical Architecture

```mermaid
flowchart TD
    subgraph Browser ["Client Tier (Browser)"]
        UI["Next.js 14 App Router<br/>(Tailwind CSS, 56px+ Elder Touch Targets)"]
        FB_AUTH["Firebase Auth Client SDK<br/>(ID Token Generation)"]
    end

    subgraph Vercel ["Server Tier (Vercel Node.js Serverless)"]
        AUTH_GUARD["verifyServerAuthToken()<br/>(adminAuth.verifyIdToken)"]
        RBAC["adminVerifyProfileAccess()<br/>(Least-Privilege RBAC Guard)"]
        API_PROFILES["/api/profiles/*<br/>(Profile & Member APIs)"]
        API_MEDS["/api/profiles/[id]/medications/*<br/>(Medication CRUD)"]
        API_APPTS["/api/profiles/[id]/appointments/*<br/>(Appointment CRUD)"]
        API_ADH["/api/profiles/[id]/adherence<br/>(Adherence Logging)"]
        API_CRON["/api/notifications/process<br/>(GET/POST Cron Handler)"]
        SCHED_EVAL["scheduler-evaluator.ts<br/>(Timezone & Eligibility Math)"]
        CLEAN["firestore-clean.ts<br/>(Safe Undefined Field Stripper)"]
        EMAIL_SVC["email-service.ts<br/>(Resend Email Dispatcher)"]
    end

    subgraph Database ["Data & Cloud Services"]
        FIRESTORE[("Cloud Firestore<br/>(Client Deny-All Security Rules)")]
        RESEND_API["Resend API<br/>(Transactional Emails)"]
        VERCEL_CRON["Vercel Cron Scheduler<br/>(Daily Execution)"]
    end

    UI -->|"1. User Actions"| FB_AUTH
    FB_AUTH -->|"2. Bearer ID Token"| AUTH_GUARD
    AUTH_GUARD -->|"3. Authenticated AppUser"| RBAC
    RBAC --> API_PROFILES & API_MEDS & API_APPTS & API_ADH
    API_MEDS & API_APPTS & API_ADH --> CLEAN
    CLEAN -->|"4. Admin SDK Writes"| FIRESTORE
    VERCEL_CRON -->|"Daily GET with CRON_SECRET"| API_CRON
    API_CRON --> SCHED_EVAL
    SCHED_EVAL -->|"Check Schedules"| FIRESTORE
    API_CRON --> EMAIL_SVC
    EMAIL_SVC -->|"Dispatch Alert"| RESEND_API
```

### Technology Stack Table

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router, React 18, React DOM) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/), Tailwind Merge, CLSX |
| **Authentication** | [Firebase Authentication](https://firebase.google.com/products/auth) (Email/Password, ID Tokens) |
| **Server Database** | [Google Cloud Firestore](https://firebase.google.com/products/firestore) accessed exclusively via [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) |
| **Email Infrastructure** | [Resend](https://resend.com/) Transactional Email API |
| **Hosting & Deployment** | [Vercel](https://vercel.com/) (Hobby Plan, Serverless Node.js Runtime) |
| **Automated Testing** | [Vitest 2](https://vitest.dev/), React Testing Library, JSDOM |
| **Containerization (Optional)** | Multi-stage [Dockerfile](file:///d:/Downloads/MediBridge-AI/Dockerfile), `cloudbuild.yaml` |

---

## 🔒 Privacy, Security & Data Protection

- **Server-Side Authorization on Every Request**: All database operations are executed exclusively through protected Next.js API routes using the Firebase Admin SDK.
- **Client Deny-All Security Rules**: Direct browser access to Cloud Firestore is locked down (`allow read, write: if false;`). Compromised client sessions cannot manipulate Firestore directly.
- **Strict Least-Privilege RBAC**: Permissions (`view_profile`, `manage_medications`, `manage_appointments`, `log_adherence`, `invite_members`) are verified on the server for each profile.
- **Profile Isolation**: Users can only read or modify data for care profiles where they have an active membership. Cross-profile access attempts return HTTP 403 Forbidden.
- **Zero Client Credential Exposure**: Service account keys (`FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`) and email API keys (`RESEND_API_KEY`, `CRON_SECRET`) are server-only environment variables and never bundled into client JavaScript.
- **PII / PHI Redaction in Logs**: Outbound email addresses are masked (`j***e@example.com`) in server logs to prevent diagnostic log leaks.
- **Single-Use Passcode Verification**: Profile invitations utilize salted cryptographic hashes, 48-hour expiration, and atomic transactional consumption.

> [!NOTE]  
> **Regulatory Notice**: While MediBridge AI applies robust security, encryption, and authorization principles, this project is a hackathon MVP and makes **no claim of HIPAA certification or formal regulatory compliance**.

---

## 🖥️ User Interface Overview

The live interactive application can be explored directly on the [Production Deployment](https://medi-bridge-ai-ruddy.vercel.app/). Below is an overview of the core interface views:

| View | Purpose & Elder Accessibility Features |
| :--- | :--- |
| **Today's Medications** | Displays today's scheduled doses with 56px+ buttons for "I Took This", "Skip", and "Missed". Displays meal instructions (With food / Empty stomach) and pill appearance cues. |
| **Prescribed Regimens** | Tabbed view displaying all active prescriptions, dosages, schedule times, and refill warnings with high-contrast Edit and Delete controls. |
| **Upcoming Consultations** | Chronological list of doctor visits, clinic address, phone number with 1-tap dial, preparation notes, companion escort names, and transport flags. |
| **Adherence Summary** | Weekly adherence progress bar, streak feedback, and completion analytics. |
| **Caregiver Circle** | Connected family members and caregivers, their roles, and 1-tap emergency dial buttons. |
| **Passcode Invite Modal** | Elder-friendly dialog to view or generate 6-character access passcodes to link family caregivers. |
| **Notifications Panel** | Controls for dose reminders, missed dose alerts, caregiver escalation, timezone settings, "Send Test Email", and recent delivery history. |

---

## 🛠️ How to Run Locally

### Prerequisites
- Node.js `18.x` or `20.x`
- npm `9.x` or `10.x`
- (Optional) Firebase Project credentials for real authentication

### 1. Clone the Repository
```bash
git clone https://github.com/dubeyayush270-coder/MediBridge-AI.git
cd MediBridge-AI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

> [!TIP]  
> **No Firebase Setup Needed to Evaluate**: If Firebase credentials are not provided in `.env.local`, MediBridge AI automatically enters **Instant Demo Evaluation Mode**. You can immediately test adding medications, tracking doses, scheduling visits, and toggling preferences using realistic fictional patient profiles.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run the Test Suite
```bash
# Run all 128 tests
npm test

# Run tests in watch mode
npm run test:watch
```

### 6. Run Type-Check & Production Build
```bash
# Verify TypeScript strict type-checking
npm run typecheck

# Build the optimized production bundle
npm run build
```

---

## 🔑 Environment Variables Reference

Configure these variables in `.env.local` for local development, or in the [Vercel Project Settings](https://vercel.com) for production:

```ini
# ========================================================
# 1. Firebase Client Configuration (Browser / Public)
# ========================================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=medibridge-ai-4f126
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# ========================================================
# 2. Firebase Admin SDK Configuration (Server-Side Only)
# ========================================================
FIREBASE_PROJECT_ID=medibridge-ai-4f126
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@medibridge-ai-4f126.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nMultiline\nPrivate\nKey\n-----END PRIVATE KEY-----\n"

# ========================================================
# 3. Transactional Email Service (Resend)
# ========================================================
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=MediBridge AI <onboarding@resend.dev>

# ========================================================
# 4. Notification Scheduler Security Secret
# ========================================================
CRON_SECRET=your_secure_random_cron_secret_string
```

---

## 🚀 Deployment

### Live Production Host: Vercel
The live application is hosted on **Vercel** connected to the `main` branch of this GitHub repository:
- **Production URL**: [https://medi-bridge-ai-ruddy.vercel.app/](https://medi-bridge-ai-ruddy.vercel.app/)
- **Vercel Cron**: Configured via `vercel.json` to trigger `/api/notifications/process` daily at `08:00 UTC`.

### Alternative Container Deployment: Google Cloud Run
A production-ready [Dockerfile](file:///d:/Downloads/MediBridge-AI/Dockerfile), [cloudbuild.yaml](file:///d:/Downloads/MediBridge-AI/cloudbuild.yaml), and deployment script [deploy-cloudrun.ps1](file:///d:/Downloads/MediBridge-AI/deploy-cloudrun.ps1) are included in the repository. These provide an alternative deployment path for Google Cloud Run with container health probes (`/api/health`) and Application Default Credentials (ADC).

---

## 🧪 Testing & Verification

MediBridge AI includes a comprehensive automated test suite with **128 tests across 14 test suites**:

```
 Test Files  14 passed (14)
      Tests  128 passed (128)
```

### Verified Test Areas
- **Firestore Data Sanitization**: Confirmed that `cleanFirestoreData` safely strips undefined fields while preserving `null`, `0`, `false`, `""`, and `Date` objects ([milestone4-production-stability.test.ts](file:///d:/Downloads/MediBridge-AI/src/tests/milestone4-production-stability.test.ts)).
- **Medication CRUD & Schedule Generation**: Tested addition, editing, deletion, and schedule computation ([milestone2-medications.test.ts](file:///d:/Downloads/MediBridge-AI/src/tests/milestone2-medications.test.ts)).
- **Appointment CRUD**: Tested minimal valid creation, updates, and deletion ([milestone2-appointments.test.ts](file:///d:/Downloads/MediBridge-AI/src/tests/milestone2-appointments.test.ts)).
- **Adherence Tracking & Deduplication**: Verified Taken, Skipped, and Missed status transitions and duplicate prevention ([milestone4-production-stability.test.ts](file:///d:/Downloads/MediBridge-AI/src/tests/milestone4-production-stability.test.ts)).
- **UI Component Rendering**: Verified that `CardContent` and `CardFooter` render children and forward DOM props properly ([components.test.tsx](file:///d:/Downloads/MediBridge-AI/src/tests/components.test.tsx)).
- **Notification Scheduling Math**: Verified UTC conversions, reminder lead times, missed dose grace periods, and appointment reminder eligibility across timezones ([milestone3-evaluator.test.ts](file:///d:/Downloads/MediBridge-AI/src/tests/milestone3-evaluator.test.ts)).
- **Email Service & Template Safety**: Tested Resend integration, email masking, and template rendering ([milestone3-notifications.test.ts](file:///d:/Downloads/MediBridge-AI/src/tests/milestone3-notifications.test.ts)).
- **Scheduler Endpoint Security**: Verified dual `GET` and `POST` method support, `CRON_SECRET` validation, and 401/503 error handling ([milestone4-production-stability.test.ts](file:///d:/Downloads/MediBridge-AI/src/tests/milestone4-production-stability.test.ts)).
- **Server-Side Authorization & Isolation**: Verified strict negative authorization (HTTP 401 for unauthenticated calls, HTTP 403 for cross-profile access) ([server-security.test.ts](file:///d:/Downloads/MediBridge-AI/src/tests/server-security.test.ts)).
- **Passcode Cryptography**: Verified salt generation, SHA-256 verification, and brute-force lockout ([passcode.test.ts](file:///d:/Downloads/MediBridge-AI/src/tests/passcode.test.ts)).

---

## ⚠️ Honest Limitations & Current Scope

In the spirit of transparent engineering and hackathon judging criteria:

1. **Test-Email Inbox Confirmation**: Live email delivery relies on a valid `RESEND_API_KEY`. While the integration, payload formation, and Resend API contracts are thoroughly tested, automated delivery to a real physical inbox was not independently verified during automated test execution.
2. **Resend Free-Tier Recipient Restrictions**: On Resend's free tier (`onboarding@resend.dev`), emails can only be delivered to the verified email address of the Resend account owner until a custom domain is configured.
3. **Vercel Hobby Scheduler Frequency**: Vercel Hobby accounts strictly limit built-in cron executions to at most once per day (`0 8 * * *`). Timely per-dose reminders (e.g., within 15 minutes of scheduled times throughout the day) require an external sub-hourly webhook scheduler (e.g., cron-job.org or GitHub Actions) triggering `/api/notifications/process`, or manual clicks on "Check Alerts Now".
4. **Cross-Account Multi-Device Testing**: Automated unit tests verify that unauthorized users receive HTTP 403 when requesting cross-profile data. However, concurrent multi-browser live user testing across distinct physical accounts was not exhaustively completed in manual QA.
5. **Reverse AI Scribe is Roadmap, NOT Implemented**: Reverse AI Scribe (speech-to-text consultation transcription and translation into plain elder language) is a conceptual future enhancement described on the roadmap below; it is **not** an implemented feature in this MVP.

---

## 🗺️ Future Roadmap

- [ ] **Reverse AI Scribe**: Real-time ambient audio recording during doctor consultations that extracts medication changes, converts medical jargon into 6th-grade reading level summaries, and automatically adds new prescriptions to the care plan.
- [ ] **Plain-Language Audio Readback**: Voice synthesis for elderly users with visual impairments to hear their daily medication instructions read aloud.
- [ ] **Dedicated Sub-Hourly Cron Runner**: Migration of the notification processor to a continuous Cloud Run Job or Cloud Scheduler for real-time per-minute dose alerts.
- [ ] **Smart Pillbox Hardware Integration**: Webhook synchronization with smart blister packs or IoT pill dispensers to confirm dose ingestion automatically.
- [ ] **Caregiver SMS / WhatsApp Alerts**: Multi-channel notification delivery via Twilio SMS and WhatsApp for urgent missed dose notifications.

---

## ⚕️ Medical Disclaimer

**MediBridge AI is designed solely for informational, care coordination, and adherence tracking purposes.**
- MediBridge AI does not provide medical diagnoses, treatment plans, or clinical decision-making.
- MediBridge AI does not alter, replace, or supersede instructions provided by licensed physicians or healthcare providers.
- If a patient experiences an adverse reaction, missed dose uncertainty, or medical emergency, they should immediately contact their primary physician or emergency services (911 / 112).
- All patient names, clinic details, and medication regimens used in demonstration mode and automated test fixtures are 100% fictional.

---

## 🏷️ Repository Metadata Recommendations

For the GitHub repository settings:

- **About Description**:  
  *From Doctor's Advice to Everyday Care. An accessible elderly care coordination, medication adherence, and appointment management platform built for Catalyst 2026.*
- **Website URL**:  
  `https://medi-bridge-ai-ruddy.vercel.app/`
- **Topics**:  
  `hackathon-project`, `nextjs`, `typescript`, `firebase`, `healthcare`, `elderly-care`, `accessibility`, `medication-adherence`, `resend`, `catalyst2026`
