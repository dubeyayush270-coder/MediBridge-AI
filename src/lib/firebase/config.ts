function sanitizeClientEnv(val: string | undefined): string | undefined {
  if (!val) return undefined;
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Client Firebase configuration helper
 */
export const firebaseClientConfig = {
  apiKey: sanitizeClientEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitizeClientEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeClientEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeClientEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeClientEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeClientEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseClientConfig.apiKey &&
    firebaseClientConfig.projectId &&
    firebaseClientConfig.authDomain
  );
}
