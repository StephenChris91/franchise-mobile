"use client";

import { useEffect, useState } from "react";
import ReactionBar from "./ReactionBar";
import type { ReactionCount, ReactionType } from "@/types/blog";

interface StickyReactionBarProps {
  slug: string;
  counts: ReactionCount[];
  userReactions: ReactionType[];
  isLoggedIn: boolean;
  isApproved: boolean;
}

export default function StickyReactionBar(props: StickyReactionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling 300px
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-center gap-4 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 shadow-lg">
      <ReactionBar {...props} compact />
    </div>
  );
}
