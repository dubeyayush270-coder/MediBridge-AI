import * as admin from "firebase-admin";

let cachedApp: admin.app.App | null = null;

/**
 * Checks whether valid server credentials exist for the Firebase Admin SDK.
 * Returns true if explicit service account credentials or cloud runtime (Cloud Run ADC) are present.
 */
export function isFirebaseAdminCredentialConfigured(): boolean {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (clientEmail && privateKey) return true;
  if (process.env.K_SERVICE || process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
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
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "medibridge-ai-4f126";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // 1. Explicit Service Account Credentials (preferred for local development & CI)
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

  // 2. Google Cloud Run / Google Cloud environment (Application Default Credentials)
  if (process.env.K_SERVICE || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      cachedApp = admin.initializeApp({
        projectId,
      });
      return cachedApp;
    } catch (err) {
      console.warn("[Firebase Admin] Failed to initialize with Cloud Run ADC:", err);
    }
  }

  // 3. In local development without service account or ADC, do NOT invoke
  // admin.credential.applicationDefault() because it attempts to reach metadata.google.internal
  // and throws ENOTFOUND. Return null so callers can handle 503 BACKEND_CREDENTIALS_MISSING cleanly.
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
