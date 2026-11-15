import { describe, it, expect } from "vitest";
import { formatElderDate, formatElderTime, cn } from "../lib/utils";

describe("Formatting and Utility Helpers", () => {
  it("formats dates into clear, elder-friendly full strings", () => {
    const formatted = formatElderDate("2026-11-18T10:00:00Z");
    expect(formatted).toContain("November 18, 2026");
  });

  it("handles invalid dates gracefully", () => {
    expect(formatElderDate("invalid-date-string")).toBe("Invalid date");
  });

  it("formats 24h string times into 12h AM/PM strings for seniors", () => {
    expect(formatElderTime("08:00")).toBe("8:00 AM");
    expect(formatElderTime("13:30")).toBe("1:30 PM");
    expect(formatElderTime("21:15")).toBe("9:15 PM");
  });

  it("merges tailwind classnames cleanly", () => {
    const result = cn("bg-white", "p-4", "p-6", { "text-red-500": true, "text-blue-500": false });
    expect(result).toContain("p-6");
    expect(result).not.toContain("p-4");
    expect(result).toContain("text-red-500");
  });
});
