"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/lib/actions/admin-blog";

export default function DeletePostButton({ id, title }: { id: string; title: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(() => deletePost(id));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
      title="Delete"
    >
      <Trash2 size={15} />
    </button>
  );
}
