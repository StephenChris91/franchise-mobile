"use client";

import { useState, useTransition } from "react";
import { Check, Star, X, Loader2 } from "lucide-react";
import { upsertRsvp, cancelRsvp } from "@/lib/actions/events";

type RsvpStatus = "going" | "interested" | "not_going" | null;

interface Props {
  eventId: string;
  initialStatus: RsvpStatus;
  isApproved: boolean;
}

const OPTIONS: { value: "going" | "interested" | "not_going"; label: string; icon: React.ComponentType<{ size: number; className?: string }> }[] = [
  { value: "going", label: "Going", icon: Check },
  { value: "interested", label: "Interested", icon: Star },
  { value: "not_going", label: "Can't go", icon: X },
];

const ACTIVE: Record<string, string> = {
  going: "bg-green-600 text-white border-green-600",
  interested: "bg-blue-600 text-white border-blue-600",
  not_going: "bg-gray-600 text-white border-gray-600",
};

export default function RsvpButton({ eventId, initialStatus, isApproved }: Props) {
  const [status, setStatus] = useState<RsvpStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!isApproved) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Members only</p>
        <p className="text-xs text-amber-700">
          You need an approved Franchise Church account to RSVP.{" "}
          <a href="/auth/signup" className="underline font-medium">
            Apply for membership →
          </a>
        </p>
      </div>
    );
  }

  function handleSelect(value: "going" | "interested" | "not_going") {
    setError("");
    if (status === value) {
      // Cancel RSVP
      startTransition(async () => {
        try {
          await cancelRsvp(eventId);
          setStatus(null);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Failed to cancel RSVP");
        }
      });
    } else {
      startTransition(async () => {
        try {
          await upsertRsvp(eventId, value);
          setStatus(value);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Failed to save RSVP");
        }
      });
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Are you attending?
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = status === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={isPending}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition disabled:opacity-60 ${
                active
                  ? ACTIVE[value]
                  : "bg-white border-gray-200 text-gray-700 hover:border-[#af601a] hover:text-[#af601a]"
              }`}
            >
              {isPending && active ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Icon size={14} />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {status && !isPending && (
        <p className="text-xs text-gray-400 mt-2">
          {status === "going"
            ? "You're going! A confirmation email has been sent."
            : status === "interested"
            ? "You've marked yourself as interested."
            : "You've marked yourself as not attending."}
          {" "}
          <button
            onClick={() => handleSelect(status)}
            className="text-gray-500 underline"
          >
            Change
          </button>
        </p>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
