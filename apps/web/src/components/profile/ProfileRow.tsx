import type { ReactNode } from "react";

export function ProfileRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-xs text-white/40 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-white/80">{children}</span>
    </div>
  );
}

export function ProfileBlank() {
  return <span className="text-white/25 italic">Not set</span>;
}
