/**
 * MediBridge AI - Passcode Hashing and Verification
 *
 * Designed according to hackathon security requirements:
 * 1. Passcodes are only used for linking/joining shared care profiles, NEVER as primary account passwords.
 * 2. Only salted hashes are stored in the database.
 * 3. Constant-time comparison prevents timing attacks.
 * 4. Includes expiration and brute-force attempt limits.
 */

// Generate a random 6 to 8-character elder-friendly passcode (numbers + uppercase letters, omitting ambiguous chars like 0/O, 1/I)
const PASSCODE_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateElderFriendlyPasscode(length = 6): string {
  let passcode = "";
  const randomBytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  for (let i = 0; i < length; i++) {
    passcode += PASSCODE_CHARSET[randomBytes[i] % PASSCODE_CHARSET.length];
  }
  return passcode;
}

export function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * SHA-256 hash using Web Crypto API (supported in Node.js >= 18 and all modern browsers)
 */
export async function hashPasscode(passcode: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${passcode.trim().toUpperCase()}`);
  
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Fallback for environments where crypto.subtle is not accessible
  let hash = 0;
  const str = `${salt}:${passcode.trim().toUpperCase()}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}

/**
 * Verify passcode with constant-time equality check to prevent timing attacks
 */
export async function verifyPasscode(
  candidatePasscode: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  if (!candidatePasscode || !storedHash || !storedSalt) return false;
  const computedHash = await hashPasscode(candidatePasscode, storedSalt);
  
  if (computedHash.length !== storedHash.length) {
    return false;
  }
  
  let mismatch = 0;
  for (let i = 0; i < computedHash.length; i++) {
    mismatch |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  
  return mismatch === 0;
}

/**
 * Check if a passcode invite is still valid
 */
export function isInviteValid(invite: {
  expiresAt: string;
  isUsed: boolean;
  failedAttempts: number;
  maxAttempts: number;
}): { valid: boolean; reason?: string } {
  if (invite.isUsed) {
    return { valid: false, reason: "This access passcode has already been used." };
  }

  const now = new Date().getTime();
  const expiry = new Date(invite.expiresAt).getTime();
  if (now > expiry) {
    return { valid: false, reason: "This invitation code has expired. Please request a new one." };
  }

  if (invite.failedAttempts >= invite.maxAttempts) {
    return {
      valid: false,
      reason: "Too many incorrect attempts. This invitation has been locked for security.",
    };
  }

  return { valid: true };
}
