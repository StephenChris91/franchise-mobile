"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, EyeOff } from "lucide-react";
import { editComment, deleteComment, hideComment } from "@/lib/actions/blog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { CommentWithAuthor } from "@/types/blog";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  comment: CommentWithAuthor;
  replies: CommentWithAuthor[];
  currentUserId?: string;
  currentUserRole?: string;
  slug: string;
  onReply: (parentId: string, authorName: string) => void;
}

export default function CommentItem({
  comment,
  replies,
  currentUserId,
  currentUserRole,
  slug,
  onReply,
}: CommentItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editError, setEditError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isOwner = currentUserId === comment.userId;
  const isAdmin =
    currentUserRole === "admin" || currentUserRole === "pastor";
  const isDeleted = comment.content === "[deleted]";

  // Within 10 minutes of posting
  const canEdit =
    isOwner &&
    !isDeleted &&
    Date.now() - new Date(comment.createdAt).getTime() < 10 * 60 * 1000;

  const handleEdit = () => {
    setEditError("");
    startTransition(async () => {
      try {
        await editComment(comment.id, editContent);
        setEditing(false);
      } catch (e: unknown) {
        setEditError(e instanceof Error ? e.message : "Failed to edit");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      try {
        await deleteComment(comment.id);
      } catch {
        // swallow
      }
    });
  };

  const handleHide = () => {
    if (!confirm("Hide this comment from all users?")) return;
    startTransition(async () => {
      try {
        await hideComment(comment.id);
      } catch {
        // swallow
      }
    });
  };

  const avatarFallback =
    comment.authorName?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="shrink-0">
        {comment.authorPhoto ? (
          <Image
            src={comment.authorPhoto}
            alt={comment.authorName ?? "User"}
            width={36}
            height={36}
            className="rounded-full object-cover w-9 h-9"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#af601a] flex items-center justify-center text-white text-sm font-bold">
            {avatarFallback}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          {/* Author + time */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {comment.authorUsername ? (
                <Link
                  href={`/profile/${comment.authorUsername}`}
                  className="text-sm font-semibold text-gray-900 hover:text-[#af601a] transition-colors"
                >
                  {comment.authorName}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-gray-900">
                  {comment.authorName ?? "Anonymous"}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {comment.isEdited && !isDeleted && (
                <span className="text-xs text-gray-400 italic">(edited)</span>
              )}
            </div>

            {/* Actions menu (owner or admin) */}
            {(isOwner || isAdmin) && !isDeleted && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 transition cursor-pointer"
                  aria-label="Comment options"
                >
                  <MoreHorizontal size={16} />
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 top-7 z-10 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditing(true);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          handleHide();
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 cursor-pointer"
                      >
                        <EyeOff size={13} /> Hide
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content or edit form */}
          {editing ? (
            <div className="flex flex-col gap-2 mt-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                maxLength={2000}
                className="text-sm"
                autoFocus
              />
              {editError && (
                <p className="text-xs text-red-600">{editError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isPending || !editContent.trim()}
                  className="text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="text-xs bg-transparent border border-gray-200 text-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                "text-sm leading-relaxed",
                isDeleted ? "text-gray-400 italic" : "text-gray-700"
              )}
            >
              {comment.content}
            </p>
          )}
        </div>

        {/* Reply button */}
        {!isDeleted && currentUserId && (
          <button
            onClick={() =>
              onReply(comment.id, comment.authorName ?? "Someone")
            }
            className="mt-1 ml-1 text-xs text-gray-400 hover:text-[#af601a] transition-colors cursor-pointer"
          >
            Reply
          </button>
        )}

        {/* Nested replies */}
        {replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 pl-2 border-l-2 border-gray-100">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                replies={[]} // max 1 level deep
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                slug={slug}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
