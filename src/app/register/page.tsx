"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { UserRole } from "@/lib/types/user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, User, Users, HeartHandshake, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [role, setRole] = useState<UserRole>("elderly_patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await signUp(email, password, fullName, role);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setError(res.error || "Failed to create account.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions: { id: UserRole; title: string; desc: string; icon: typeof User }[] = [
    {
      id: "elderly_patient",
      title: "Elderly Patient",
      desc: "I am managing my personal medication schedule, doctor visits, and daily care.",
      icon: User,
    },
    {
      id: "family_member",
      title: "Family Member",
      desc: "I am an adult son, daughter, or relative helping coordinate care for a loved one.",
      icon: Users,
    },
    {
      id: "caregiver",
      title: "Professional Caregiver",
      desc: "I am a visiting nurse, home health aide, or designated clinical caregiver.",
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-teal-700 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
          <Heart className="w-8 h-8 fill-white/20 stroke-white stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-black text-navy-900">Create MediBridge AI Account</h1>
        <p className="text-base text-navy-600">
          Choose your primary role to customize your care interface
        </p>
      </div>

      <Card className="border-2 border-navy-100 shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              role="alert"
              className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-900 text-sm font-semibold flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-base font-bold text-navy-900 block">
              Select Your Role:
            </label>
            <div className="space-y-2.5">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRole(opt.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 ${
                      isSelected
                        ? "bg-teal-50 border-teal-600 shadow-sm"
                        : "bg-white border-navy-100 hover:border-navy-200"
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected ? "bg-teal-700 text-white" : "bg-navy-100 text-navy-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-navy-900">{opt.title}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-navy-600 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4 pt-2 border-t border-navy-100">
            <Input
              label="Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              required
            />

            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. eleanor@example.com"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Input
                label="Confirm Password *"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full text-lg font-bold min-h-[52px]"
          >
            Create MediBridge Account
          </Button>

          <div className="text-center text-sm text-navy-600">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-700 font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
