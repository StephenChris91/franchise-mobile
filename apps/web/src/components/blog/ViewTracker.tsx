"use client";

import { useEffect } from "react";

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Get or create a persistent session ID in localStorage
    let sessionId = localStorage.getItem("fc_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("fc_session_id", sessionId);
    }

    fetch(`/api/posts/${slug}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {
      // Silently fail — view tracking is non-critical
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
