"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { UserRole } from "@/lib/types/user";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, enterDemoMode, isFirebaseReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to sign in");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    enterDemoMode(role);
    router.push("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-teal-700 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
          <Heart className="w-8 h-8 fill-white/20 stroke-white stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-black text-navy-900">Welcome Back</h1>
        <p className="text-base text-navy-600">
          Sign in to access your MediBridge AI care dashboard
        </p>
      </div>

      <Card className="border-2 border-navy-100 shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-900 text-sm font-semibold flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. eleanor.vance@example.com"
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full text-lg font-bold min-h-[52px]"
          >
            Sign In
          </Button>
        </form>

        {/* Quick Demo Sign-in for Hackathon Judges */}
        <div className="mt-8 pt-6 border-t border-navy-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-navy-500">
              Hackathon Instant Demo Roles
            </span>
            <Badge variant="teal" size="sm">
              <Sparkles className="w-3 h-3 text-teal-700" />
              1-Click
            </Badge>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("elderly_patient")}
              className="w-full p-3 rounded-xl border-2 border-teal-200 bg-teal-50 hover:bg-teal-100/80 text-left transition flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-navy-900 group-hover:text-teal-900">
                  Eleanor Vance
                </p>
                <p className="text-xs text-navy-600">Care Recipient (Patient, Age 76)</p>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-700 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("family_member")}
              className="w-full p-3 rounded-xl border border-navy-200 bg-white hover:bg-navy-50 text-left transition flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-navy-900">Marcus Vance</p>
                <p className="text-xs text-navy-600">Family Member (Son & Primary Caregiver)</p>
              </div>
              <ArrowRight className="w-4 h-4 text-navy-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("caregiver")}
              className="w-full p-3 rounded-xl border border-navy-200 bg-white hover:bg-navy-50 text-left transition flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-navy-900">Nurse Maria Ramos, RN</p>
                <p className="text-xs text-navy-600">Visiting Clinical Nurse</p>
              </div>
              <ArrowRight className="w-4 h-4 text-navy-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-navy-600">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="text-teal-700 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </Card>
    </div>
  );
}
