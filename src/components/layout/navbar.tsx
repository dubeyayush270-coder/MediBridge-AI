"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { getRoleLabel } from "@/lib/auth/rbac";
import {
  Heart,
  Pill,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const pathname = usePathname();
  const { user, activeProfile, isDemoMode, isFirebaseReady, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Heart },
    { href: "/dashboard/medications", label: "Medications", icon: Pill },
    { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
    { href: "/dashboard/care-team", label: "Care Team", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-navy-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tagline */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-lg p-1"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-white/20 stroke-white stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-navy-900 tracking-tight">
                  MediBridge<span className="text-teal-700">AI</span>
                </span>
                {isDemoMode && (
                  <Badge variant="warning" size="sm" className="hidden sm:inline-flex">
                    Demo Mode
                  </Badge>
                )}
              </div>
              <span className="text-xs text-navy-600 font-medium hidden sm:inline">
                From Doctor's Advice to Everyday Care
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-base transition-all ${
                      isActive
                        ? "bg-teal-50 text-teal-800 border border-teal-200"
                        : "text-navy-700 hover:bg-navy-50 hover:text-navy-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-teal-700" : "text-navy-500"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Menu & Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-navy-100">
                <div className="flex flex-col items-end text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-navy-900">
                      {user.displayName}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                  </div>
                  <span className="text-xs text-navy-600 font-medium">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2.5 text-navy-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition border border-navy-200"
                  title="Sign out of account"
                  aria-label="Sign out of account"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-base font-bold text-navy-800 hover:text-navy-950 hover:bg-navy-50 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 text-base font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-navy-800 hover:bg-navy-50 border border-navy-200"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-navy-100 bg-white px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          {user ? (
            <>
              <div className="p-3 bg-teal-50 rounded-2xl mb-3 border border-teal-200">
                <p className="text-base font-bold text-navy-900">{user.displayName}</p>
                <p className="text-xs text-teal-800 font-medium">{getRoleLabel(user.role)}</p>
                {activeProfile && (
                  <p className="text-xs text-navy-600 mt-1">
                    Care recipient: <strong>{activeProfile.patientName}</strong>
                  </p>
                )}
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-lg ${
                      isActive ? "bg-teal-700 text-white" : "text-navy-800 hover:bg-navy-50"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-lg text-red-700 hover:bg-red-50 mt-2 border border-red-200"
              >
                <LogOut className="w-6 h-6" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-lg font-bold text-navy-900 border border-navy-200 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-lg font-bold text-white bg-teal-700 rounded-xl"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
