"use client";

import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:   "bg-[#4A9EFF] text-black font-semibold hover:bg-[#3a8eef] border-transparent",
  secondary: "bg-transparent text-[#4A9EFF] border-[rgba(74,158,255,0.3)] hover:bg-[rgba(74,158,255,0.08)]",
  ghost:     "bg-transparent text-[#666] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)]",
  danger:    "bg-transparent text-[#FF6B6B] border-[rgba(255,107,107,0.3)] hover:bg-[rgba(255,107,107,0.08)]",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-5 py-2.5 text-sm rounded-xl",
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  disabled = false,
  onClick,
  className,
  type = "button",
  fullWidth = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "border transition-all duration-150 cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
    >
      {children}
    </button>
  );
}
