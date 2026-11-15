import * as admin from "firebase-admin";
import * as fs from "fs";

let cachedApp: admin.app.App | null = null;

/**
 * Checks whether valid server credentials exist for the Firebase Admin SDK.
 * Returns true if explicit service account credentials, GOOGLE_APPLICATION_CREDENTIALS,
 * or cloud runtime (Cloud Run ADC) are present.
 */
export function isFirebaseAdminCredentialConfigured(): boolean {
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) return true;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) return true;
    } catch {
      // If fs check blocked by sandbox or error, return true if env var is set
      return true;
    }
  }
  // Cloud Run or Google Cloud environments automatically provide Application Default Credentials (ADC)
  if (process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT || process.env.GAE_SERVICE) return true;
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

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "medibridge-ai-4f126";

  // 1. Check GOOGLE_APPLICATION_CREDENTIALS file path
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    try {
      if (fs.existsSync(credPath)) {
        const saContent = fs.readFileSync(credPath, "utf8");
        const sa = JSON.parse(saContent);
        cachedApp = admin.initializeApp({
          credential: admin.credential.cert(sa),
          projectId: sa.project_id || projectId,
        });
        return cachedApp;
      }
    } catch (err) {
      console.warn("[Firebase Admin] Could not load GOOGLE_APPLICATION_CREDENTIALS file directly:", err);
    }
  }

  // 2. Explicit Service Account Credentials (preferred for local development & CI)
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

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

  // 3. Google Cloud Run / Google Cloud environment (Application Default Credentials)
  if (process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT || process.env.NODE_ENV === "production") {
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
  return app ? admin.firestore(app) : null;
}

export const adminApp = getAdminApp();
export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
