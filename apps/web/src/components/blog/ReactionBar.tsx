"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toggleReaction } from "@/lib/actions/blog";
import type { ReactionCount, ReactionType } from "@/types/blog";
import { cn } from "@/lib/utils";

const REACTIONS: Array<{
  type: ReactionType;
  emoji: string;
  label: string;
}> = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "amen", emoji: "🙌", label: "Amen" },
  { type: "praying", emoji: "🙏", label: "Praying" },
];

interface ReactionBarProps {
  slug: string;
  counts: ReactionCount[];
  userReactions: ReactionType[];
  isLoggedIn: boolean;
  isApproved: boolean;
  /** Compact mode for the sticky mobile bar */
  compact?: boolean;
}

export default function ReactionBar({
  slug,
  counts,
  userReactions,
  isLoggedIn,
  isApproved,
  compact = false,
}: ReactionBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showLoginSheet, setShowLoginSheet] = useState(false);

  // Optimistic state
  const [optimisticCounts, setOptimisticCounts] =
    useState<ReactionCount[]>(counts);
  const [optimisticUserReactions, setOptimisticUserReactions] =
    useState<ReactionType[]>(userReactions);

  const getCount = (type: ReactionType) =>
    optimisticCounts.find((c) => c.reactionType === type)?.count ?? 0;

  const handleReaction = (type: ReactionType) => {
    if (!isLoggedIn || !isApproved) {
      setShowLoginSheet(true);
      return;
    }

    const isActive = optimisticUserReactions.includes(type);

    // Optimistic update
    setOptimisticUserReactions((prev) =>
      isActive ? prev.filter((r) => r !== type) : [...prev, type]
    );
    setOptimisticCounts((prev) => {
      const existing = prev.find((c) => c.reactionType === type);
      if (existing) {
        return prev.map((c) =>
          c.reactionType === type
            ? { ...c, count: isActive ? c.count - 1 : c.count + 1 }
            : c
        );
      }
      return [...prev, { reactionType: type, count: 1 }];
    });

    startTransition(async () => {
      try {
        await toggleReaction(slug, type);
      } catch {
        // Revert on error
        setOptimisticUserReactions(userReactions);
        setOptimisticCounts(counts);
      }
    });
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2",
          compact ? "gap-1" : "flex-wrap gap-3"
        )}
      >
        {REACTIONS.map(({ type, emoji, label }) => {
          const active = optimisticUserReactions.includes(type);
          const count = getCount(type);

          return (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              disabled={isPending}
              title={label}
              aria-label={`${label} (${count})`}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer disabled:opacity-60",
                compact ? "px-2.5 py-1 text-xs" : "",
                active
                  ? "border-[#af601a] bg-[#af601a]/10 text-[#af601a]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#af601a] hover:text-[#af601a]"
              )}
            >
              <span className={compact ? "text-base" : "text-lg"}>{emoji}</span>
              {!compact && <span>{label}</span>}
              {count > 0 && (
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    active ? "text-[#af601a]" : "text-gray-500"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Login prompt sheet */}
      <Sheet
        open={showLoginSheet}
        onClose={() => setShowLoginSheet(false)}
        title="Join the conversation"
      >
        <p className="text-sm text-gray-600 mb-6">
          {!isLoggedIn
            ? "Sign in or create an account to react and comment on posts."
            : "Your account is awaiting approval from our pastoral team. You'll be able to react and comment once approved."}
        </p>
        {!isLoggedIn && (
          <div className="flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={() => {
                setShowLoginSheet(false);
                router.push("/auth/login");
              }}
            >
              Sign in
            </Button>
            <Button
              variant="secondary"
              className="w-full bg-transparent border border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setShowLoginSheet(false);
                router.push("/auth/signup");
              }}
            >
              Create account
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}
