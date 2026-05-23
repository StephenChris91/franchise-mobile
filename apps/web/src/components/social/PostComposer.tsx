"use client";

import { useState, useTransition, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold, Italic, Link2, List, ImagePlus, X, Loader2, ChevronDown, Plus,
} from "lucide-react";
import { createPost } from "@/lib/actions/social";
import { cn } from "@/lib/utils";
import type { SocialPost } from "../../../db/schema";

const POST_TYPES = [
  { value: "regular", label: "Post", color: "text-gray-600" },
  { value: "prayer", label: "Prayer Request", color: "text-purple-600" },
  { value: "testimony", label: "Testimony", color: "text-green-600" },
  { value: "announcement", label: "Announcement", color: "text-[#af601a]" },
] as const;

type PostType = (typeof POST_TYPES)[number]["value"];

interface ThreadSegment {
  id: string;
  content: string;
}

interface Props {
  groupId?: string | null;
  authorName: string;
  authorPhoto?: string | null;
  onPosted?: () => void;
  onPostedWithData?: (post: SocialPost) => void;
}

const MAX_CHARS = 150;
const MAX_THREAD_SEGMENTS = 5;

export default function PostComposer({
  groupId,
  authorName,
  authorPhoto,
  onPosted,
  onPostedWithData,
}: Props) {
  const [postType, setPostType] = useState<PostType>("regular");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [threadSegments, setThreadSegments] = useState<ThreadSegment[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Share something with the community…" }),
      CharacterCount.configure({ limit: MAX_CHARS }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[72px] focus:outline-none text-gray-900",
      },
    },
  });

  const charCount = editor?.storage.characterCount.characters() ?? 0;
  const hasContent = !(editor?.isEmpty ?? true);

  const uploadImage = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setError("Max file size is 5 MB"); return; }
    if (mediaUrls.length >= 4) { setError("Max 4 images per post"); return; }
    setUploading(true);
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const paramsToSign = { timestamp, folder: "franchise-social", transformation: "c_limit,w_1200,h_1200,q_auto,f_webp" };
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign }),
      });
      const { signature, apiKey } = await signRes.json();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("folder", "franchise-social");
      fd.append("transformation", "c_limit,w_1200,h_1200,q_auto,f_webp");
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      setMediaUrls((prev) => [...prev, data.secure_url]);
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  }, [mediaUrls.length]);

  const addThreadSegment = () => {
    if (threadSegments.length >= MAX_THREAD_SEGMENTS) return;
    setThreadSegments((prev) => [...prev, { id: crypto.randomUUID(), content: "" }]);
  };

  const updateSegment = (id: string, content: string) => {
    if (content.length > MAX_CHARS) return;
    setThreadSegments((prev) => prev.map((s) => s.id === id ? { ...s, content } : s));
  };

  const removeSegment = (id: string) => {
    setThreadSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = () => {
    const mainJson = editor?.getJSON();
    if (!mainJson || editor?.isEmpty) { setError("Write something first"); return; }
    setError("");

    // Build content: single post or thread
    const content = threadSegments.length > 0
      ? JSON.stringify({
          type: "thread",
          segments: [
            mainJson,
            ...threadSegments.map((s) => ({ type: "plain", text: s.content })),
          ],
        })
      : JSON.stringify(mainJson);

    startTransition(async () => {
      try {
        const result = await createPost({ content, postType, groupId, mediaUrls });
        editor?.commands.clearContent();
        setMediaUrls([]);
        setPostType("regular");
        setThreadSegments([]);
        onPostedWithData?.(result.post);
        onPosted?.();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to post");
      }
    });
  };

  const initials = authorName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isAtLimit = charCount >= MAX_CHARS;
  const canAddThread = hasContent && threadSegments.length < MAX_THREAD_SEGMENTS;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {authorPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={authorPhoto} alt={authorName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-sm font-bold text-white">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Post type selector */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-900">{authorName}</span>
            <div className="relative">
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as PostType)}
                className="text-xs border border-gray-200 rounded-full px-2 py-0.5 pr-5 bg-gray-50 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#af601a]"
              >
                {POST_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Main editor */}
          <div
            className="border border-gray-200 rounded-xl px-3 py-2 cursor-text"
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 mt-2">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("bold") && "text-gray-900 bg-gray-100")}
              title="Bold"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("italic") && "text-gray-900 bg-gray-100")}
              title="Italic"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("bulletList") && "text-gray-900 bg-gray-100")}
              title="List"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                const url = window.prompt("Enter URL:");
                if (url) editor?.chain().focus().setLink({ href: url }).run();
              }}
              className={cn("p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition", editor?.isActive("link") && "text-gray-900 bg-gray-100")}
              title="Link"
            >
              <Link2 size={14} />
            </button>
            <label
              className={cn(
                "p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer",
                mediaUrls.length >= 4 && "opacity-40 pointer-events-none"
              )}
              title="Add image"
            >
              <ImagePlus size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
              />
            </label>
            <span className={cn("ml-auto text-xs tabular-nums", isAtLimit ? "text-red-500 font-semibold" : charCount > MAX_CHARS * 0.8 ? "text-amber-500" : "text-gray-400")}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>

          {/* Thread segments */}
          {threadSegments.map((seg, i) => (
            <div key={seg.id} className="mt-2 relative">
              {/* Thread connector */}
              <div className="absolute left-3.5 -top-2 h-2 w-px bg-gray-200" />
              <div className="border border-gray-200 rounded-xl px-3 py-2">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={seg.content}
                      onChange={(e) => updateSegment(seg.id, e.target.value)}
                      rows={2}
                      placeholder={`Part ${i + 2} of your thread…`}
                      className="w-full resize-none text-sm text-gray-900 focus:outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSegment(seg.id)}
                    className="p-0.5 text-gray-300 hover:text-red-400 transition mt-0.5 shrink-0"
                    title="Remove segment"
                  >
                    <X size={13} />
                  </button>
                </div>
                <p className={cn("text-right text-[10px] mt-1", seg.content.length >= MAX_CHARS ? "text-red-500" : "text-gray-400")}>
                  {seg.content.length}/{MAX_CHARS}
                </p>
              </div>
            </div>
          ))}

          {/* Image previews */}
          {(mediaUrls.length > 0 || uploading) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setMediaUrls((p) => p.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
              {uploading && (
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

          <div className="flex items-center justify-between mt-3">
            {/* Add thread segment */}
            {canAddThread ? (
              <button
                type="button"
                onClick={addThreadSegment}
                className="flex items-center gap-1 text-xs text-[#af601a] hover:text-[#c47020] transition"
              >
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                  <Plus size={9} />
                </span>
                Add to thread
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !hasContent}
              className="px-5 py-2 rounded-full bg-[#af601a] text-white text-sm font-semibold hover:bg-[#c47020] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? "Posting…" : uploading ? "Uploading…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
