"use client";

import { useState, useTransition } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, Loader2 } from "lucide-react";
import { postAnnouncement } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AnnouncementComposer() {
  const [pinDays, setPinDays] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your announcement here…" }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[180px] focus:outline-none text-gray-900 p-4",
      },
    },
  });

  function handleSubmit() {
    const content = JSON.stringify(editor?.getJSON());
    if (editor?.isEmpty) { setError("Write something first"); return; }
    setError("");
    startTransition(async () => {
      try {
        await postAnnouncement({ content, pinDays });
        editor?.commands.clearContent();
        setPinDays(0);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to post");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 pt-3 border-b border-gray-100 pb-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("bold") && "bg-gray-100 text-gray-900")}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("italic") && "bg-gray-100 text-gray-900")}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("bulletList") && "bg-gray-100 text-gray-900")}
        >
          <List size={14} />
        </button>
      </div>

      {/* Editor */}
      <div
        className="cursor-text min-h-[200px]"
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Pin for</label>
          <select
            value={pinDays}
            onChange={(e) => setPinDays(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#af601a]"
          >
            <option value={0}>Don&apos;t pin</option>
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>1 week</option>
            <option value={14}>2 weeks</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          {success && <p className="text-xs text-green-600 font-medium">Announcement posted ✓</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={isPending || editor?.isEmpty}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#af601a] text-white text-sm font-semibold hover:bg-[#c47020] transition disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? "Posting…" : "Post Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}
