"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";
import { createComment } from "@/lib/actions/blog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import CommentItem from "./CommentItem";
import type { CommentWithAuthor } from "@/types/blog";

interface CommentSectionProps {
  slug: string;
  comments: CommentWithAuthor[];
  currentUserId?: string;
  currentUserRole?: string;
  currentApprovalStatus?: string;
  isLoggedIn: boolean;
}

export default function CommentSection({
  slug,
  comments,
  currentUserId,
  currentUserRole,
  currentApprovalStatus,
  isLoggedIn,
}: CommentSectionProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{
    parentId: string;
    authorName: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isApproved = currentApprovalStatus === "approved";

  // Group: top-level comments + their replies
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesMap = new Map<string, CommentWithAuthor[]>();
  comments
    .filter((c) => c.parentId)
    .forEach((c) => {
      const arr = repliesMap.get(c.parentId!) ?? [];
      arr.push(c);
      repliesMap.set(c.parentId!, arr);
    });

  const handleReply = (parentId: string, authorName: string) => {
    setReplyTo({ parentId, authorName });
    // Scroll to form and focus
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    setError("");

    startTransition(async () => {
      try {
        await createComment(slug, content, replyTo?.parentId);
        setContent("");
        setReplyTo(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to post comment");
      }
    });
  };

  return (
    <section className="mt-12 pt-10 border-t border-gray-200">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-8">
        <MessageSquare size={22} className="text-[#af601a]" />
        Discussion
        {comments.length > 0 && (
          <span className="text-base font-normal text-gray-400">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* Comment composer */}
      {isLoggedIn && isApproved ? (
        <div className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-4">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 text-sm text-gray-500">
              <span>
                Replying to{" "}
                <strong className="text-gray-700">{replyTo.authorName}</strong>
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            placeholder="Share a thought, testimony, or question…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
            className="mb-3 bg-white text-sm"
          />
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {content.length}/2000
            </span>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !content.trim()}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Posting…
                </>
              ) : (
                "Post comment"
              )}
            </Button>
          </div>
        </div>
      ) : isLoggedIn && !isApproved ? (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your account is awaiting approval from our pastoral team. You&apos;ll be
          able to comment once approved.
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
          <p className="mb-3">
            <strong className="text-gray-900">Join the conversation.</strong>{" "}
            Sign in or create an account to comment.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/auth/login")}>Sign in</Button>
            <Button
              variant="secondary"
              className="bg-transparent border border-gray-200 text-gray-700 hover:bg-gray-100"
              onClick={() => router.push("/auth/signup")}
            >
              Create account
            </Button>
          </div>
        </div>
      )}

      {/* Comment list */}
      {topLevel.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesMap.get(comment.id) ?? []}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              slug={slug}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </section>
  );
}
