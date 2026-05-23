"use client";

import { useTransition } from "react";
import { Copy } from "lucide-react";
import { duplicateEvent } from "@/lib/actions/events";

export default function DuplicateEventButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => void duplicateEvent(id))}
      title="Duplicate event"
      className="p-1.5 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition disabled:opacity-40"
    >
      <Copy size={14} />
    </button>
  );
}
