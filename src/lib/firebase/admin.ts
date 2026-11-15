import * as admin from "firebase-admin";

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // On Google Cloud Run or GCP, application default credentials work automatically
  if (process.env.K_SERVICE || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return admin.initializeApp({
        projectId,
      });
    } catch (e) {
      console.warn("Could not initialize with Cloud Run application default credentials:", e);
    }
  }

  return null;
}

export const adminApp = initializeFirebaseAdmin();
export const adminAuth = adminApp ? admin.auth(adminApp) : null;
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
