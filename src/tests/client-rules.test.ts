import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("PHASE 1 & 5 — Firestore Security Rules Verification", () => {
  const rulesPath = path.resolve(__dirname, "../../firestore.rules");
  const rulesContent = fs.readFileSync(rulesPath, "utf8");

  it("ensures firestore.rules exists and specifies rules_version = '2'", () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toContain("service cloud.firestore");
  });

  it("enforces strict deny-all on client SDK direct access (allow read, write: if false)", () => {
    // Assert that the catch-all document rule denies both read and write
    expect(rulesContent).toMatch(/match\s*\/\{document=\*\*\}/);
    expect(rulesContent).toMatch(/allow\s*read,\s*write:\s*if\s*false;/);
  });

  it("verifies that no insecure public or authenticated read/write wildcards exist in firestore.rules", () => {
    // Ensure no 'allow read: if true;' or 'allow write: if true;' or 'allow read, write: if isAuthenticated();'
    expect(rulesContent).not.toMatch(/allow\s+read,\s*write:\s*if\s+true/i);
    expect(rulesContent).not.toMatch(/allow\s+read:\s*if\s+true/i);
    expect(rulesContent).not.toMatch(/allow\s+write:\s*if\s+true/i);
    expect(rulesContent).not.toMatch(/allow\s+read,\s*write:\s*if\s+isAuthenticated/i);
  });
});
