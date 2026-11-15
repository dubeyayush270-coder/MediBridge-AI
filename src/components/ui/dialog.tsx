"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm"
    >
      <div
        className={cn(
          "w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-navy-100 p-6 sm:p-8 animate-in fade-in-50 zoom-in-95",
          className
        )}
      >
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-navy-100">
          <div>
            <h2 id="dialog-title" className="text-2xl font-bold text-navy-900">
              {title}
            </h2>
            {description && (
              <p className="text-base text-navy-600 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal dialog"
            className="p-2 text-navy-500 hover:text-navy-900 hover:bg-navy-50 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
