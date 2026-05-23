import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" &&
          "bg-[#af601a] text-white",
        variant === "secondary" &&
          "bg-gray-100 text-gray-800",
        variant === "outline" &&
          "border border-current bg-transparent",
        className
      )}
      {...props}
    />
  );
}
