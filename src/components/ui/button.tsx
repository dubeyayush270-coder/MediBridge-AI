import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "elder-action";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-colors duration-150 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-600 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]";

    const variantStyles = {
      primary:
        "bg-teal-700 text-white hover:bg-teal-800 shadow-sm active:bg-teal-900",
      secondary:
        "bg-navy-900 text-white hover:bg-navy-800 shadow-sm",
      outline:
        "border-2 border-teal-700 text-teal-800 bg-white hover:bg-teal-50",
      ghost:
        "text-navy-900 hover:bg-navy-50",
      danger:
        "bg-red-700 text-white hover:bg-red-800 shadow-sm",
      "elder-action":
        "bg-teal-700 text-white text-xl font-bold tracking-wide hover:bg-teal-800 shadow-md min-h-[56px] px-6 py-3 border-2 border-teal-800",
    };

    const sizeStyles = {
      sm: "text-sm px-3 py-1.5 min-h-[36px]",
      md: "text-base px-4 py-2.5 min-h-[44px]",
      lg: "text-lg px-6 py-3 min-h-[50px]",
      xl: "text-xl px-8 py-4 min-h-[58px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
