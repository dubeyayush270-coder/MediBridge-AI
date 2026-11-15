import { getAdminAuth } from "../firebase/admin";

export interface VerifiedAuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

/**
 * Verify Firebase ID Token on the server using Firebase Admin SDK.
 * Strict zero-trust verification: rejects requests if token is invalid, expired,
 * or if Firebase Admin Auth is unconfigured. Insecure fallbacks are removed.
 */
export async function verifyServerAuthToken(req: Request): Promise<VerifiedAuthUser | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    console.warn("[Security] Server token verification blocked: Firebase Admin SDK is not configured.");
    return null;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      displayName: decoded.name || decoded.email?.split("@")[0] || "User",
    };
  } catch (adminErr) {
    console.warn("[Security] adminAuth.verifyIdToken rejected invalid token:", adminErr);
    return null;
  }
}
