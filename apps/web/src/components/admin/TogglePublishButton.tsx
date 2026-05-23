"use client";

import { useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { updateEvent } from "@/lib/actions/events";

export default function TogglePublishButton({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => void updateEvent(id, { isPublished: !isPublished }))}
      title={isPublished ? "Unpublish" : "Publish"}
      className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-40"
    >
      {isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}
