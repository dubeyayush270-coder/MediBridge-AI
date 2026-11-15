"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Pill,
  Users,
  Settings2,
} from "lucide-react";
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationRecord,
} from "@/lib/types/notification";
import { useAuth } from "@/lib/firebase/auth-context";

interface NotificationsPanelProps {
  profileId: string;
}

const COMMON_TIMEZONES = [
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
  { label: "US Eastern (New York, Atlanta)", value: "America/New_York" },
  { label: "US Central (Chicago, Dallas)", value: "America/Chicago" },
  { label: "US Mountain (Denver, Phoenix)", value: "America/Denver" },
  { label: "US Pacific (Los Angeles, Seattle)", value: "America/Los_Angeles" },
  { label: "India Standard Time (IST)", value: "Asia/Kolkata" },
  { label: "United Kingdom (London, GMT/BST)", value: "Europe/London" },
  { label: "Central European (Paris, Berlin)", value: "Europe/Paris" },
  { label: "Australia Eastern (Sydney, Melbourne)", value: "Australia/Sydney" },
];

export function NotificationsPanel({ profileId }: NotificationsPanelProps) {
  const { user, firebaseUser, isDemoMode } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [senderAddress, setSenderAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Fetch notification data
  const loadData = useCallback(async () => {
    if (!profileId || isDemoMode) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = firebaseUser ? await firebaseUser.getIdToken() : "";
      const res = await fetch(`/api/profiles/${profileId}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.preferences) setPreferences(data.preferences);
        if (data.notifications) setNotifications(data.notifications);
        setEmailConfigured(Boolean(data.emailProviderConfigured));
        if (data.senderAddress) setSenderAddress(data.senderAddress);
      }
    } catch (err: unknown) {
      console.warn("Could not load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId, isDemoMode, firebaseUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save Preferences
  const handleSavePreferences = async () => {
    if (isDemoMode) {
      setFeedback({ type: "info", message: "Preferences saved (Demo Mode simulation)." });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const token = firebaseUser ? await firebaseUser.getIdToken() : "";
      const res = await fetch(`/api/profiles/${profileId}/notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save preferences");

      setPreferences(data.preferences);
      setFeedback({ type: "success", message: "Care reminder preferences saved successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to save preferences." });
    } finally {
      setSaving(false);
    }
  };

  // Trigger Live Test Email
  const handleSendTestEmail = async () => {
    if (isDemoMode) {
      setFeedback({
        type: "info",
        message: "Test email simulated. (Sign in with a real account to dispatch live emails via Resend).",
      });
      return;
    }

    try {
      setTesting(true);
      setFeedback(null);
      const token = firebaseUser ? await firebaseUser.getIdToken() : "";
      const res = await fetch("/api/notifications/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profileId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch test email");
      }

      setFeedback({
        type: "success",
        message: `Test email successfully sent to ${data.deliveredTo}! Check your inbox (Message ID: ${data.messageId || "sent"}).`,
      });
      // Refresh history
      loadData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Could not dispatch test email. Ensure RESEND_API_KEY is configured in Vercel.",
      });
    } finally {
      setTesting(false);
    }
  };

  // Run On-Demand Dose & Appointment Alert Check
  const handleRunAlertCheck = async () => {
    if (isDemoMode) {
      setFeedback({
        type: "info",
        message: "Scanned care schedule: 0 reminders due right now (Demo simulation).",
      });
      return;
    }

    try {
      setChecking(true);
      setFeedback(null);
      const token = firebaseUser ? await firebaseUser.getIdToken() : "";
      const res = await fetch("/api/notifications/check-now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profileId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check alerts");

      const stats = data.stats;
      const sentCount = (stats?.sentReminders || 0) + (stats?.sentMissedAlerts || 0) + (stats?.sentAppointments || 0);

      setFeedback({
        type: "success",
        message: `Alert scan complete: ${sentCount} new notification(s) sent. (Dose reminders: ${stats?.sentReminders || 0}, Missed dose alerts: ${stats?.sentMissedAlerts || 0}, Appointments: ${stats?.sentAppointments || 0}).`,
      });
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Alert scan failed." });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="p-6 md:p-8 space-y-8 bg-white border border-navy-100 shadow-sm rounded-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <Bell className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-navy-900 tracking-tight">
                Care Reminders & Alerts
              </h2>
              {emailConfigured ? (
                <Badge variant="success" size="sm">
                  Resend Active
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Email Key Required
                </Badge>
              )}
            </div>
            <p className="text-sm text-navy-600 mt-0.5">
              Automated dose reminders, missed-dose escalation, and doctor appointments
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleRunAlertCheck}
            disabled={checking || loading}
            className="flex items-center gap-2 font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Checking..." : "Check Alerts Now"}</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSendTestEmail}
            disabled={testing || loading}
            className="flex items-center gap-2 font-bold"
          >
            <Send className="w-4 h-4" />
            <span>{testing ? "Sending..." : "Send Test Email"}</span>
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : feedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm font-semibold leading-relaxed">{feedback.message}</div>
        </div>
      )}

      {/* Main Grid: Preferences & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Notification Preferences (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-teal-700" />
              Notification Settings
            </h3>
            <span className="text-xs text-navy-500 font-medium">Elder-friendly defaults active</span>
          </div>

          <div className="space-y-4">
            {/* 1. Medication Reminders */}
            <div className="p-4 rounded-2xl border border-navy-100 bg-navy-50/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-navy-900 text-base">Medication Dose Reminders</span>
                </div>
                <p className="text-sm text-navy-600">
                  Sends an email reminder before each scheduled dose time.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.medicationReminders}
                onChange={(e) =>
                  setPreferences({ ...preferences, medicationReminders: e.target.checked })
                }
                className="w-6 h-6 mt-1 text-teal-600 rounded-lg focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* 2. Missed Dose Alerts */}
            <div className="p-4 rounded-2xl border border-navy-100 bg-navy-50/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-navy-900 text-base">Missed Dose Alerts</span>
                </div>
                <p className="text-sm text-navy-600">
                  Sends an alert if a scheduled dose is unconfirmed after the grace period.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.missedDoseAlerts}
                onChange={(e) =>
                  setPreferences({ ...preferences, missedDoseAlerts: e.target.checked })
                }
                className="w-6 h-6 mt-1 text-teal-600 rounded-lg focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* 3. Caregiver Escalation Alert */}
            <div className="p-4 rounded-2xl border border-navy-100 bg-navy-50/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-navy-900 text-base">Notify Family Caregivers</span>
                </div>
                <p className="text-sm text-navy-600">
                  When enabled, designated family caregivers receive an email if a dose is missed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.caregiverAlerts}
                onChange={(e) =>
                  setPreferences({ ...preferences, caregiverAlerts: e.target.checked })
                }
                className="w-6 h-6 mt-1 text-teal-600 rounded-lg focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* 4. Appointment Reminders */}
            <div className="p-4 rounded-2xl border border-navy-100 bg-navy-50/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-navy-900 text-base">Doctor Appointment Reminders</span>
                </div>
                <p className="text-sm text-navy-600">
                  Sends doctor consultation details and preparation notes in advance.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.appointmentReminders}
                onChange={(e) =>
                  setPreferences({ ...preferences, appointmentReminders: e.target.checked })
                }
                className="w-6 h-6 mt-1 text-teal-600 rounded-lg focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* Configuration Row: Timezone & Lead Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-navy-900">Preferred Timezone</label>
                <select
                  value={preferences.preferredTimezone}
                  onChange={(e) =>
                    setPreferences({ ...preferences, preferredTimezone: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-navy-900">Reminder Lead Time</label>
                <select
                  value={preferences.reminderLeadMinutes}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      reminderLeadMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-900 text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  <option value={15}>15 minutes before dose</option>
                  <option value={30}>30 minutes before dose (Recommended)</option>
                  <option value={60}>1 hour before dose</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSavePreferences}
              disabled={saving}
              className="w-full sm:w-auto font-bold px-8 shadow-sm"
            >
              {saving ? "Saving Preferences..." : "Save Notification Preferences"}
            </Button>
          </div>
        </div>

        {/* Right Column: Notification Delivery History (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-700" />
              Delivery History
            </h3>
            <span className="text-xs text-navy-500 font-medium">
              {notifications.length} record(s)
            </span>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center bg-navy-50/30 border border-dashed border-navy-200 rounded-2xl space-y-2">
              <Mail className="w-8 h-8 text-navy-400 mx-auto" />
              <p className="text-sm font-bold text-navy-700">No notifications dispatched yet</p>
              <p className="text-xs text-navy-500">
                Tap &quot;Send Test Email&quot; to verify live transactional delivery.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {notifications.map((n) => {
                const dateFormatted = new Date(n.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={n.id}
                    className="p-3.5 bg-white border border-navy-100 rounded-xl space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-navy-900 text-sm truncate">{n.title}</span>
                      {n.status === "sent" ? (
                        <Badge variant="success" size="sm">
                          Delivered
                        </Badge>
                      ) : n.status === "failed" ? (
                        <Badge variant="danger" size="sm">
                          Failed
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-navy-600 line-clamp-1">{n.summary}</p>
                    <div className="flex items-center justify-between text-[11px] text-navy-400 font-medium pt-1 border-t border-navy-50">
                      <span>To: {n.recipientEmail}</span>
                      <span>{dateFormatted}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
