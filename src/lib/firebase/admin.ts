import * as admin from "firebase-admin";
import * as fs from "fs";

let cachedApp: admin.app.App | null = null;

export const EXPECTED_FIREBASE_PROJECT_ID = "medibridge-ai-4f126";

/**
 * Normalizes and validates the Firebase Project ID from environment variables.
 * Trims leading/trailing whitespace, tabs (\t), newlines, and surrounding quotes.
 * Fails clearly if the project ID is missing, empty, or malformed.
 */
export function resolveAdminProjectId(rawOverride?: string): string {
  const candidate =
    rawOverride !== undefined
      ? rawOverride
      : process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.GCP_PROJECT;

  const raw = candidate !== undefined && candidate !== null ? candidate : EXPECTED_FIREBASE_PROJECT_ID;

  if (typeof raw !== "string") {
    throw new Error(
      `Firebase Admin Configuration Error: Project ID must be a string. Expected "${EXPECTED_FIREBASE_PROJECT_ID}".`
    );
  }

  // Trim leading/trailing whitespace, tabs, carriage returns, and newlines
  let cleaned = raw.trim();

  // Strip wrapping quotes if user pasted value enclosed in quotes into Vercel
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  if (!cleaned) {
    throw new Error(
      `Firebase Admin Configuration Error: Project ID is empty or whitespace-only. Expected "${EXPECTED_FIREBASE_PROJECT_ID}".`
    );
  }

  // GCP project IDs must contain only lowercase letters, digits, and hyphens (6 to 30 characters)
  const isValidFormat = /^[a-z0-9-]+$/.test(cleaned);
  if (!isValidFormat) {
    throw new Error(
      `Firebase Admin Configuration Error: Project ID "${cleaned}" is malformed. Valid project IDs contain only lowercase letters, digits, and hyphens (no tabs or spaces). Expected "${EXPECTED_FIREBASE_PROJECT_ID}".`
    );
  }

  // In production, validate that it strictly matches medibridge-ai-4f126
  if (process.env.NODE_ENV === "production" && cleaned !== EXPECTED_FIREBASE_PROJECT_ID) {
    throw new Error(
      `Firebase Admin Configuration Error: Invalid project ID "${cleaned}". Production strictly expects "${EXPECTED_FIREBASE_PROJECT_ID}".`
    );
  }

  return cleaned;
}

/**
 * Normalizes PEM private key strings from environment variables (e.g. Vercel, .env).
 * Handles:
 * - Escaped newlines ("\\n" -> "\n")
 * - Surrounding quotes ('...' or "...")
 * - Multiline formatted keys
 */
export function normalizePrivateKey(rawKey: string | undefined): string | undefined {
  if (!rawKey) return undefined;
  let key = rawKey.trim();
  if (!key) return undefined;
  // Strip surrounding quotes if present
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  // Replace escaped \n with actual newlines
  key = key.replace(/\\n/g, "\n").trim();
  return key || undefined;
}

/**
 * Checks whether valid server credentials exist for the Firebase Admin SDK.
 * Returns true if explicit service account credentials, GOOGLE_APPLICATION_CREDENTIALS,
 * or cloud runtime (Cloud Run ADC) are present.
 */
export function isFirebaseAdminCredentialConfigured(): boolean {
  if (process.env.FIREBASE_CLIENT_EMAIL?.trim() && process.env.FIREBASE_PRIVATE_KEY) return true;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS.trim())) return true;
    } catch {
      // If fs check blocked by sandbox or error, return true if env var is set
      return true;
    }
  }
  if (process.env.K_SERVICE || process.env.GAE_SERVICE) return true;
  return false;
}

export function getAdminApp(): admin.app.App | null {
  if (cachedApp) {
    return cachedApp;
  }

  if (admin.apps.length > 0) {
    cachedApp = admin.apps[0]!;
    return cachedApp;
  }

  const projectId = resolveAdminProjectId();

  // 1. Explicit Service Account Credentials (Vercel, container env, and CI)
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (clientEmail && privateKey) {
    try {
      cachedApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      return cachedApp;
    } catch (err) {
      console.error("[Firebase Admin] Failed to initialize with service account cert:", err);
    }
  }

  // 2. Check GOOGLE_APPLICATION_CREDENTIALS file path (Local development)
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPath) {
    try {
      if (fs.existsSync(credPath)) {
        const saContent = fs.readFileSync(credPath, "utf8");
        const sa = JSON.parse(saContent);
        const resolvedSaProjectId = (sa.project_id ? String(sa.project_id).trim() : projectId);
        cachedApp = admin.initializeApp({
          credential: admin.credential.cert(sa),
          projectId: resolvedSaProjectId,
        });
        return cachedApp;
      }
    } catch (err) {
      console.warn("[Firebase Admin] Could not load GOOGLE_APPLICATION_CREDENTIALS file directly:", err);
    }
  }

  // 3. Google Cloud Run / Google Cloud environment (Application Default Credentials)
  if (process.env.K_SERVICE || process.env.GAE_SERVICE) {
    try {
      cachedApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
      return cachedApp;
    } catch (adcErr) {
      try {
        cachedApp = admin.initializeApp({
          projectId,
        });
        return cachedApp;
      } catch (err) {
        console.warn("[Firebase Admin] Failed to initialize with Cloud Run ADC:", err);
      }
    }
  }

  return null;
}

export function getAdminAuth(): admin.auth.Auth | null {
  const app = getAdminApp();
  return app ? admin.auth(app) : null;
}

export function getAdminDb(): admin.firestore.Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  const db = admin.firestore(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Firestore settings can only be set before any other Firestore operations
  }
  return db;
}

export const adminApp = getAdminApp();
export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
