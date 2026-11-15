import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, helperText, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-base font-bold text-navy-900 tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "w-full rounded-xl border-2 bg-white px-4 py-3 text-base sm:text-lg text-navy-900 placeholder:text-navy-400 min-h-[48px] transition duration-150",
            error
              ? "border-red-600 focus:border-red-700 focus:ring-2 focus:ring-red-200"
              : "border-navy-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-navy-600">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-sm font-semibold text-red-700 flex items-center gap-1">
            <span aria-hidden="true">⚠️</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
