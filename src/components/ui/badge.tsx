import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "teal" | "navy" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md" | "lg";
}

export function Badge({
  className,
  variant = "teal",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    teal: "bg-teal-50 text-teal-800 border-teal-300",
    navy: "bg-navy-50 text-navy-800 border-navy-300",
    success: "bg-emerald-50 text-emerald-800 border-emerald-300",
    warning: "bg-amber-50 text-amber-900 border-amber-300",
    danger: "bg-red-50 text-red-900 border-red-300",
    neutral: "bg-stone-100 text-stone-800 border-stone-300",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 font-medium",
    md: "text-sm px-2.5 py-1 font-semibold",
    lg: "text-base px-3 py-1.5 font-bold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
