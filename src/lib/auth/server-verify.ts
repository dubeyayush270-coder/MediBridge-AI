import { adminAuth, adminDb } from "../firebase/admin";
import { firebaseClientConfig } from "../firebase/config";
import { UserRole } from "../types/user";

export interface VerifiedAuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

/**
 * Verify Firebase ID Token on the server.
 * Uses Firebase Admin SDK if service account is configured.
 * Otherwise verifies directly with Google Identity Toolkit API using client configuration.
 */
export async function verifyServerAuthToken(req: Request): Promise<VerifiedAuthUser | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  // 1. If Firebase Admin SDK is available, verify with Admin SDK
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email || "",
        displayName: decoded.name,
      };
    } catch (adminErr) {
      console.warn("adminAuth.verifyIdToken failed:", adminErr);
    }
  }

  // 2. Direct verification with Google Identity Toolkit REST API
  const apiKey = firebaseClientConfig.apiKey;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const userObj = data.users?.[0];
        if (userObj && userObj.localId) {
          return {
            uid: userObj.localId,
            email: userObj.email || "",
            displayName: userObj.displayName,
          };
        }
      }
    } catch (netErr) {
      console.error("Google token verification network error:", netErr);
    }
  }

  return null;
}
