"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "@/lib/actions/events";

export default function DeleteEventButton({ id, title }: { id: string; title: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        startTransition(() => void deleteEvent(id));
      }}
      title="Delete"
      className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
    >
      <Trash2 size={14} />
    </button>
  );
}
