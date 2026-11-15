# MediBridge AI
> **From Doctor's Advice to Everyday Care.**  
> *Built for the Catalyst 2026 PromptWars Solo Hackathon.*

---

## 🌟 Product Vision & Purpose

**MediBridge AI** is an accessible, AI-powered elderly healthcare companion designed to bridge the gap between complex doctor consultations and everyday home care. It empowers older adults to manage medications with dignity, keeps track of upcoming clinical appointments, and connects families and professional caregivers through secure, passcode-linked care circles.

---

## 🏆 Hackathon Implementation Highlights (Milestone 1)

### 1. Elder-First Accessible Design System
- **Readable Typography & Contrast**: Deep navy text (`#0F1A2F`) on warm off-white surfaces (`#FAF9F5`), preventing glare while maximizing legibility.
- **56px+ Touch Targets**: Generous button hit areas specifically accommodating arthritis, tremors, or limited motor agility.
- **Multi-Channel Status Communication**: Health statuses (taken, pending, skipped) use explicit text, distinctive icons, and color rather than color alone.
- **One-Click Physical Daily Sheet**: Print-ready daily routine view formatted for the kitchen refrigerator.

### 2. Comprehensive Elderly Care Dashboard
- **Personalized Time-Aware Greeting**: Welcomes the elder and displays today's date in full spelled-out format.
- **Today's Medications Section**: Morning, noon, evening, and bedtime dosage schedules with pill appearance notes, food instructions, and immediate one-tap adherence logging.
- **Upcoming Consultations Card**: Chronological appointments with clinic address, companion escort assignment, and questions to ask the doctor.
- **Adherence & Streak Tracker**: Visual progress bar and motivational feedback highlighting routine consistency.
- **Family & Caregiver Circle**: Lists connected family members, visiting nurses, and 1-tap emergency contacts.
- **Immediate Quick Actions**: One-click dial primary physician, review allergy alerts, and create care profiles.

### 3. Passcode-Based Care Circle Sharing
- **No Complex OAuth for Seniors**: Rather than requiring elderly users to manage authorization grants, MediBridge AI uses 6-character, high-readability passcodes.
- **Zero Plaintext Storage**: Only salted SHA-256 verifiers are stored in Firestore/database.
- **Brute-Force & Expiration Protection**: Automatic 48-hour expiration and 5-attempt lockdown prevent unauthorized access.
- **Constant-Time Verification**: Resists timing attack vectors during profile linking.

### 4. Enterprise-Grade Security & Least-Privilege RBAC
- Built-in role definitions: `elderly_patient`, `family_member`, `caregiver`.
- Strict server-side permission verification table.
- HIPAA-conscious architecture: No patient data in client URLs, zero clinical hallucinations.

### 5. Production Google Cloud Run Deployment
- Multi-stage Dockerfile with Node 20 Alpine and non-root `nextjs` user.
- Next.js `standalone` mode output.
- Dedicated `/api/health` probe endpoint for container orchestrators.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS & Lucide React
- **Authentication & Database**: Firebase Authentication, Cloud Firestore, Firebase Admin SDK
- **Testing**: Vitest, React Testing Library, JSDOM
- **Cloud Infrastructure**: Google Cloud Run, Google Cloud Scheduler
- **AI (Phase 2 Roadmap)**: Gemini 1.5 Pro / Flash for Visit Companion & Clinical OCR

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm

### 1. Clone & Install Dependencies
```bash
# In the project root
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
> *Note: If Firebase credentials are not yet configured, MediBridge AI automatically enables **Instant Demo Evaluation Mode**, providing fully functional fictional profiles and schedules so evaluators can test every flow without setup delays.*

### 3. Run Locally in Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Test Suite
```bash
npm run test
```

### 5. Type-Check and Build
```bash
npm run typecheck
npm run build
```

---

## 🐳 Google Cloud Run Deployment

Build and run using the optimized Docker container:

```bash
# 1. Build the container image
docker build -t gcr.io/[YOUR_PROJECT_ID]/medibridge-ai:v1 .

# 2. Deploy to Google Cloud Run
gcloud run deploy medibridge-ai \
  --image gcr.io/[YOUR_PROJECT_ID]/medibridge-ai:v1 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

## 🔒 Medical & Security Disclaimer

- **Clinical Safety**: MediBridge AI is an adherence tracking and care coordination tool. It does not provide medical diagnoses or alter prescribed treatments. All medical instructions must come from qualified healthcare providers.
- **Data Privacy**: All patient identities, doctors, and addresses in sample data are 100% fictional.
- **Passcode Policy**: Passcodes are for care-circle linking only, never used as account login passwords.
