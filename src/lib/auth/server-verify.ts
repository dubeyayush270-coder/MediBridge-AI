import { getAdminAuth, isFirebaseAdminCredentialConfigured } from "../firebase/admin";

export interface VerifiedAuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

export type ServerAuthResult =
  | { success: true; user: VerifiedAuthUser }
  | { success: false; status: 401; code: "MISSING_TOKEN"; error: string }
  | { success: false; status: 401; code: "INVALID_TOKEN"; error: string }
  | { success: false; status: 503; code: "BACKEND_CREDENTIALS_MISSING"; error: string };

/**
 * Verify Firebase ID Token on the server using Firebase Admin SDK.
 * Distinguishes:
 * - Missing Authorization header (401 MISSING_TOKEN)
 * - Invalid, expired, or malformed token (401 INVALID_TOKEN)
 * - Unconfigured / unreachable Admin SDK credentials (503 BACKEND_CREDENTIALS_MISSING)
 */
export async function verifyServerAuthToken(req: Request): Promise<ServerAuthResult> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      status: 401,
      code: "MISSING_TOKEN",
      error: "Unauthorized: Missing authentication token in request headers",
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      success: false,
      status: 401,
      code: "MISSING_TOKEN",
      error: "Unauthorized: Empty authentication token",
    };
  }

  // Check backend credentials before attempting verification
  const isConfigured = isFirebaseAdminCredentialConfigured();
  const adminAuth = getAdminAuth();

  if (!isConfigured || !adminAuth) {
    return {
      success: false,
      status: 503,
      code: "BACKEND_CREDENTIALS_MISSING",
      error:
        "Server Configuration Error: Firebase Admin SDK credentials are not configured. To enable live Firestore persistence, configure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local.",
    };
  }

  try {
    // Note: checkRevoked is false by default so it performs fast cryptographic JWT verification
    // without requiring an extra roundtrip to Google Identity Platform
    const decoded = await adminAuth.verifyIdToken(token, false);
    return {
      success: true,
      user: {
        uid: decoded.uid,
        email: decoded.email || "",
        displayName: decoded.name || decoded.email?.split("@")[0] || "User",
      },
    };
  } catch (adminErr: any) {
    // Check if error is due to metadata / cloud credentials connectivity
    if (
      adminErr?.message?.includes("metadata.google.internal") ||
      adminErr?.message?.includes("default credentials") ||
      adminErr?.code === "app/invalid-credential"
    ) {
      console.warn("[Security] Admin SDK credentials failed network resolution:", adminErr.message);
      return {
        success: false,
        status: 503,
        code: "BACKEND_CREDENTIALS_MISSING",
        error:
          "Server Configuration Error: Firebase Admin credentials could not connect to Google Cloud services.",
      };
    }

    console.warn("[Security] adminAuth.verifyIdToken rejected token:", adminErr?.code, adminErr?.message);
    return {
      success: false,
      status: 401,
      code: "INVALID_TOKEN",
      error: "Unauthorized: Invalid or expired authentication token",
    };
  }
}
