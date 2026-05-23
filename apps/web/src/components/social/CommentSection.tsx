"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchComments, createComment, deleteComment } from "@/lib/actions/social";

type Comment = {
  id: string;
  content: string;
  authorId: string;
  parentId: string | null;
  createdAt: Date;
  authorName: string | null;
  authorUsername: string | null;
  authorPhoto: string | null;
};

interface Props {
  postId: string;
  currentUserId?: string;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserPhoto?: string | null;
  onCommentAdded?: () => void;
}

export default function CommentSection({
  postId,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserPhoto,
  onCommentAdded,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchComments(postId)
      .then((rows) => {
        if (!cancelled) setComments(rows as Comment[]);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError("");

    // Optimistic insert
    const optimistic: Comment = {
      id: `opt-${Date.now()}`,
      content: trimmed,
      authorId: currentUserId ?? "",
      parentId: null,
      createdAt: new Date(),
      authorName: currentUserName ?? "You",
      authorUsername: null,
      authorPhoto: currentUserPhoto ?? null,
    };
    setComments((prev) => [optimistic, ...prev]);
    setText("");

    startTransition(async () => {
      try {
        await createComment(postId, trimmed);
        onCommentAdded?.();
      } catch (e: unknown) {
        // Rollback
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        setText(trimmed);
        setError(e instanceof Error ? e.message : "Failed to post comment");
      }
    });
  }

  function handleDelete(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    startTransition(async () => {
      try {
        await deleteComment(commentId);
      } catch {
        // Rollback not practical here — just let next fetch restore
      }
    });
  }

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const isAdmin = currentUserRole === "admin" || currentUserRole === "pastor";

  return (
    <div className="border-t border-gray-100 px-4 pt-3 pb-4 space-y-3 bg-gray-50/50 rounded-b-2xl">
      {/* Input row */}
      {currentUserId ? (
        <div className="flex gap-2.5 items-start">
          {/* Current user avatar */}
          {currentUserPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUserPhoto}
              alt={currentUserName}
              className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5">
              {initials(currentUserName ?? "?")}
            </div>
          )}

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Write a comment…"
              rows={1}
              className="w-full resize-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#af601a] focus:border-[#af601a] transition"
              style={{ minHeight: "36px" }}
            />
            <button
              onClick={handleSubmit}
              disabled={isPending || !text.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#af601a] disabled:text-gray-300 hover:text-[#c47020] transition"
              title="Send"
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-1">
          <Link href="/auth/login" className="text-[#af601a] underline">Log in</Link> to comment
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const canDelete =
              comment.authorId === currentUserId || isAdmin;
            const name = comment.authorName ?? "Member";

            return (
              <div key={comment.id} className="flex gap-2 group">
                {/* Avatar */}
                <div className="shrink-0">
                  {comment.authorPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.authorPhoto}
                      alt={name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-[9px] font-bold text-white">
                      {initials(name)}
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 border border-gray-100 inline-block max-w-full">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {comment.authorUsername ? (
                        <Link
                          href={`/social/members/${comment.authorUsername}`}
                          className="text-xs font-semibold text-gray-900 hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-gray-900">{name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-0.5 px-1">
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-[10px] text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5"
                      >
                        <Trash2 size={10} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
