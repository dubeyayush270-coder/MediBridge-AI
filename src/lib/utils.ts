import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date in clear, elder-friendly format (e.g., "Monday, November 18, 2026")
 */
export function formatElderDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Format time in 12-hour format with AM/PM (e.g., "8:00 AM")
 */
export function formatElderTime(timeStr: string | Date): string {
  if (timeStr instanceof Date) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(timeStr);
  }
  // If HH:mm string
  if (typeof timeStr === "string" && timeStr.includes(":")) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${period}`;
  }
  return timeStr;
}
