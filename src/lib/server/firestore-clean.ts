/**
 * MediBridge AI — Firestore Data Serialization Utility
 *
 * Recursively cleans object payloads before writing to Firestore.
 * Omits strictly undefined properties while preserving:
 * - null
 * - 0 and false
 * - empty strings ("")
 * - Date objects
 * - Firestore Timestamp objects
 * - Firestore FieldValue sentinels (serverTimestamp, delete, arrayUnion, etc.)
 * - Arrays and their recursively cleaned items
 */

export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives (string, number, boolean, bigint, symbol)
  if (typeof data !== "object") {
    return data;
  }

  // Handle Date
  if (data instanceof Date) {
    return data;
  }

  // Handle Firestore FieldValue sentinels or custom objects with method signatures
  if (
    typeof (data as any).isEqual === "function" ||
    (data as any)?.constructor?.name === "FieldValue" ||
    (data as any)?._methodName !== undefined
  ) {
    return data;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => cleanFirestoreData(item)) as unknown as T;
  }

  // Handle Plain Objects
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }

  return cleaned as T;
}
