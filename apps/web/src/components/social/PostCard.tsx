"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle, MoreHorizontal, Flag, Trash2, Pin,
  EyeOff, Pencil, Plus, X, Loader2, Check,
} from "lucide-react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import {
  toggleReaction, deletePost, reportContent,
  editPost, appendToThread, hidePost, pinPost,
} from "@/lib/actions/social";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SocialPost, Group } from "../../../db/schema";
import CommentSection from "./CommentSection";

// ─── Reaction config ──────────────────────────────────────────────────────────

const REACTIONS = [
  { type: "like" as const, emoji: "👍", label: "Like" },
  { type: "amen" as const, emoji: "🙏", label: "Amen" },
  { type: "praying" as const, emoji: "🕊️", label: "Praying" },
  { type: "heart" as const, emoji: "❤️", label: "Heart" },
];

const POST_TYPE_BADGES: Record<string, { label: string; className: string }> = {
  prayer: { label: "Prayer", className: "bg-purple-100 text-purple-700" },
  testimony: { label: "Testimony", className: "bg-green-100 text-green-700" },
  announcement: { label: "Announcement", className: "bg-[#af601a]/10 text-[#af601a]" },
  regular: { label: "", className: "" },
};

const MAX_THREAD_CHARS = 500;

// ─── Content parsing helpers ──────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Recursively extract plain text from a Tiptap doc JSON */
function tiptapToText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.type === "text") return n.text ?? "";
  if (n.type === "hardBreak") return "\n";
  const childText = (n.content ?? []).map(tiptapToText).join("");
  if (n.type === "paragraph" || n.type === "heading") return childText + (childText ? "\n" : "");
  return childText;
}

/** Render one segment to HTML */
function renderSegment(seg: unknown): string {
  if (!seg || typeof seg !== "object") return `<p>${escapeHtml(String(seg ?? ""))}</p>`;
  const s = seg as { type?: string; text?: string };
  if (s.type === "plain" && typeof s.text === "string") return `<p>${escapeHtml(s.text)}</p>`;
  if (s.type === "doc") {
    try { return generateHTML(seg as Parameters<typeof generateHTML>[0], [StarterKit, TiptapLink]); }
    catch { return `<p></p>`; }
  }
  return `<p></p>`;
}

/** Extract editable text from one segment */
function segmentToText(seg: unknown): string {
  if (!seg || typeof seg !== "object") return String(seg ?? "");
  const s = seg as { type?: string; text?: string };
  if (s.type === "plain") return s.text ?? "";
  if (s.type === "doc") return tiptapToText(seg).trim();
  return "";
}

/** Wrap plain text back into a minimal Tiptap doc */
function textToDoc(text: string) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) lines.push(text.trim() || " ");
  return {
    type: "doc",
    content: lines.map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line }],
    })),
  };
}

// Parsed post shape
type ParsedThread = { isThread: true; segments: { html: string; text: string }[] };
type ParsedRegular = { isThread: false; html: string; text: string };
type Parsed = ParsedThread | ParsedRegular;

function parseContent(raw: string): Parsed {
  try {
    const parsed = JSON.parse(raw) as { type?: string; segments?: unknown[] };
    if (parsed.type === "thread" && Array.isArray(parsed.segments)) {
      return {
        isThread: true,
        segments: parsed.segments.map((s) => ({ html: renderSegment(s), text: segmentToText(s) })),
      };
    }
    if (parsed.type === "doc") {
      return {
        isThread: false,
        html: generateHTML(parsed as Parameters<typeof generateHTML>[0], [StarterKit, TiptapLink]),
        text: tiptapToText(parsed).trim(),
      };
    }
    return { isThread: false, html: `<p>${escapeHtml(raw)}</p>`, text: raw };
  } catch {
    return { isThread: false, html: `<p>${escapeHtml(raw)}</p>`, text: raw };
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReactionCounts { like: number; amen: number; praying: number; heart: number; }

interface Props {
  post: SocialPost;
  author: { name: string; username: string; photoUrl?: string | null };
  group?: Pick<Group, "id" | "name" | "slug"> | null;
  reactionCounts: ReactionCounts;
  userReactions: string[];
  currentUserId?: string;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserPhoto?: string | null;
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

function Avatar({
  photoUrl, name, initials, size = "lg", username,
}: {
  photoUrl?: string | null; name: string; initials: string;
  size?: "lg" | "sm"; username: string;
}) {
  const cls = size === "lg"
    ? "w-10 h-10 text-sm font-bold"
    : "w-8 h-8 text-[10px] font-bold";

  return (
    <Link href={`/social/members/${username}`} className={cn("rounded-full overflow-hidden shrink-0 block", cls)}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className={cn("w-full h-full rounded-full bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-white", cls)}>
          {initials}
        </div>
      )}
    </Link>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

export default function PostCard({
  post,
  author,
  group,
  reactionCounts,
  userReactions,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserPhoto,
}: Props) {
  const [localCounts, setLocalCounts] = useState(reactionCounts);
  const [localUserReactions, setLocalUserReactions] = useState(userReactions);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingToThread, setAddingToThread] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isAuthor = currentUserId === post.authorId;
  const isAdmin = currentUserRole === "admin" || currentUserRole === "pastor";
  const typeBadge = POST_TYPE_BADGES[post.postType] ?? POST_TYPE_BADGES.regular;
  const initials = author.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  // Parse content once
  const [parsed, setParsed] = useState<Parsed>(() => parseContent(post.content));

  // Edit state — one text entry per segment for thread, single for regular
  const [editTexts, setEditTexts] = useState<string[]>([]);

  // Add-to-thread state
  const [newSegmentText, setNewSegmentText] = useState("");
  const [threadError, setThreadError] = useState("");
  const [commentCount, setCommentCount] = useState(post.commentCount);

  // ── Reactions ──────────────────────────────────────────────────────────────

  function handleReaction(type: "like" | "amen" | "praying" | "heart") {
    const hasIt = localUserReactions.includes(type);
    setLocalCounts((c) => ({ ...c, [type]: c[type] + (hasIt ? -1 : 1) }));
    setLocalUserReactions((r) => hasIt ? r.filter((t) => t !== type) : [...r, type]);
    startTransition(() =>
      void toggleReaction(post.id, type).catch(() => {
        setLocalCounts(reactionCounts);
        setLocalUserReactions(userReactions);
      })
    );
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  function handleDelete() {
    if (!confirm("Delete this post?")) return;
    startTransition(() => void deletePost(post.id));
  }

  // ── Edit ───────────────────────────────────────────────────────────────────

  function startEdit() {
    if (parsed.isThread) {
      setEditTexts(parsed.segments.map((s) => s.text));
    } else {
      setEditTexts([(parsed as ParsedRegular).text]);
    }
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditTexts([]);
  }

  function saveEdit() {
    if (editTexts.some((t) => !t.trim())) return;

    let newContentJson: string;

    if (parsed.isThread) {
      const newSegments = editTexts.map((t, i) =>
        i === 0 ? textToDoc(t) : { type: "plain", text: t.trim() }
      );
      newContentJson = JSON.stringify({ type: "thread", segments: newSegments });
    } else {
      newContentJson = JSON.stringify(textToDoc(editTexts[0]));
    }

    startTransition(async () => {
      try {
        await editPost(post.id, newContentJson);
        // Re-parse with new content
        setParsed(parseContent(newContentJson));
        setEditing(false);
        setEditTexts([]);
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  // ── Add to thread ──────────────────────────────────────────────────────────

  function submitAppend() {
    const trimmed = newSegmentText.trim();
    if (!trimmed) return;
    setThreadError("");

    startTransition(async () => {
      try {
        const result = await appendToThread(post.id, trimmed);
        setParsed(parseContent(result.content));
        setNewSegmentText("");
        setAddingToThread(false);
      } catch (e: unknown) {
        setThreadError(e instanceof Error ? e.message : "Failed to add");
      }
    });
  }

  // ── Totals ─────────────────────────────────────────────────────────────────

  const totalReactions = Object.values(localCounts).reduce((a, b) => a + b, 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4">

          {/* ── Thread layout ─────────────────────────────────────────────── */}
          {parsed.isThread ? (
            <div>
              {parsed.segments.map((seg, i) => {
                const isFirst = i === 0;
                const isLast = i === parsed.segments.length - 1;
                const showConnector = !isLast;

                return (
                  <div key={i} className="flex gap-3">
                    {/* Left col: avatar + vertical line */}
                    <div className="flex flex-col items-center shrink-0">
                      <Avatar
                        photoUrl={author.photoUrl}
                        name={author.name}
                        initials={initials}
                        size={isFirst ? "lg" : "sm"}
                        username={author.username}
                      />
                      {showConnector && (
                        <div className="w-0.5 bg-gray-200 flex-1 my-1" />
                      )}
                    </div>

                    {/* Right col: header (first only) + content */}
                    <div className={cn("flex-1 min-w-0", !isLast && "pb-2")}>
                      {isFirst && (
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={`/social/members/${author.username}`}
                                className="text-sm font-semibold text-gray-900 hover:underline"
                              >
                                {author.name}
                              </Link>
                              {group && (
                                <>
                                  <span className="text-gray-400 text-xs">in</span>
                                  <Link href={`/social/groups/${group.slug}`} className="text-xs font-medium text-[#af601a] hover:underline">
                                    {group.name}
                                  </Link>
                                </>
                              )}
                              {typeBadge.label && (
                                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", typeBadge.className)}>
                                  {typeBadge.label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              {post.updatedAt && post.updatedAt > post.createdAt && (
                                <span className="ml-1 text-gray-300">· edited</span>
                              )}
                            </p>
                          </div>
                          <PostMenu
                            isAuthor={isAuthor}
                            isAdmin={isAdmin}
                            postId={post.id}
                            onEdit={startEdit}
                            onDelete={handleDelete}
                            onReport={() => setShowReport(true)}
                            startTransition={startTransition}
                          />
                        </div>
                      )}

                      {/* Segment content or edit textarea */}
                      {editing ? (
                        <textarea
                          value={editTexts[i] ?? ""}
                          onChange={(e) => {
                            const next = [...editTexts];
                            next[i] = e.target.value;
                            setEditTexts(next);
                          }}
                          rows={3}
                          maxLength={MAX_THREAD_CHARS}
                          className="w-full resize-none border border-[#af601a] rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#af601a]"
                        />
                      ) : (
                        <div
                          className="prose prose-sm max-w-none text-gray-800 [&_a]:text-[#af601a] [&_a]:underline break-words overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: seg.html }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Edit actions */}
              {editing && (
                <div className="flex gap-2 mt-2 ml-13 pl-[52px]">
                  <button
                    onClick={saveEdit}
                    disabled={isPending}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#af601a] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                  >
                    {isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Add to thread */}
              {isAuthor && !editing && (
                <div className="flex gap-3 mt-1">
                  <div className="w-10 flex justify-center shrink-0">
                    <div className="w-0.5 h-full" />
                  </div>
                  {addingToThread ? (
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <Avatar
                          photoUrl={author.photoUrl}
                          name={author.name}
                          initials={initials}
                          size="sm"
                          username={author.username}
                        />
                        <div className="flex-1">
                          <textarea
                            autoFocus
                            value={newSegmentText}
                            onChange={(e) => setNewSegmentText(e.target.value)}
                            rows={2}
                            maxLength={MAX_THREAD_CHARS}
                            placeholder="Continue your thread…"
                            className="w-full resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]"
                          />
                          <p className={cn("text-right text-[10px] mt-0.5", newSegmentText.length >= MAX_THREAD_CHARS ? "text-red-500" : "text-gray-400")}>
                            {newSegmentText.length}/{MAX_THREAD_CHARS}
                          </p>
                          {threadError && <p className="text-xs text-red-600">{threadError}</p>}
                          <div className="flex gap-2 mt-1.5">
                            <button
                              onClick={submitAppend}
                              disabled={isPending || !newSegmentText.trim()}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#af601a] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                            >
                              {isPending ? <Loader2 size={11} className="animate-spin" /> : null}
                              Add to thread
                            </button>
                            <button
                              onClick={() => { setAddingToThread(false); setNewSegmentText(""); setThreadError(""); }}
                              className="px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToThread(true)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#af601a] transition py-1"
                    >
                      <div className="w-5 h-5 rounded-full border border-dashed border-gray-300 flex items-center justify-center hover:border-[#af601a]">
                        <Plus size={10} />
                      </div>
                      Add to thread
                    </button>
                  )}
                </div>
              )}
            </div>

          ) : (
            /* ── Regular (non-thread) post layout ─────────────────────────── */
            <div className="flex gap-3">
              <Avatar
                photoUrl={author.photoUrl}
                name={author.name}
                initials={initials}
                size="lg"
                username={author.username}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/social/members/${author.username}`} className="text-sm font-semibold text-gray-900 hover:underline">
                        {author.name}
                      </Link>
                      {group && (
                        <>
                          <span className="text-gray-400 text-xs">in</span>
                          <Link href={`/social/groups/${group.slug}`} className="text-xs font-medium text-[#af601a] hover:underline">
                            {group.name}
                          </Link>
                        </>
                      )}
                      {typeBadge.label && (
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", typeBadge.className)}>
                          {typeBadge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      {post.updatedAt && post.updatedAt > post.createdAt && (
                        <span className="ml-1 text-gray-300">· edited</span>
                      )}
                    </p>
                  </div>
                  <PostMenu
                    isAuthor={isAuthor}
                    isAdmin={isAdmin}
                    postId={post.id}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    onReport={() => setShowReport(true)}
                    startTransition={startTransition}
                  />
                </div>

                {/* Content or edit textarea */}
                {editing ? (
                  <div className="mt-2">
                    <textarea
                      value={editTexts[0] ?? ""}
                      onChange={(e) => setEditTexts([e.target.value])}
                      rows={3}
                      maxLength={MAX_THREAD_CHARS}
                      className="w-full resize-none border border-[#af601a] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#af601a]"
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={saveEdit}
                        disabled={isPending}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#af601a] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                      >
                        {isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-gray-800 [&_a]:text-[#af601a] [&_a]:underline break-words overflow-hidden mt-1.5"
                    dangerouslySetInnerHTML={{ __html: (parsed as ParsedRegular).html }}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Media ──────────────────────────────────────────────────────── */}
          {post.mediaUrls.length > 0 && (
            <div className={cn("grid gap-1 rounded-xl overflow-hidden mt-3", post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
              {post.mediaUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full aspect-square object-cover cursor-pointer hover:opacity-95 transition"
                  onClick={() => setLightboxUrl(url)}
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {/* ── Reaction summary ────────────────────────────────────────────── */}
          {totalReactions > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 border-b border-gray-100 pb-2 mt-3">
              <span className="flex">
                {REACTIONS.filter((r) => localCounts[r.type] > 0).slice(0, 3).map((r) => (
                  <span key={r.type}>{r.emoji}</span>
                ))}
              </span>
              <span>{totalReactions}</span>
            </div>
          )}

          {/* ── Action bar ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 flex-wrap mt-2">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={() => handleReaction(r.type)}
                disabled={isPending || !currentUserId}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition",
                  localUserReactions.includes(r.type)
                    ? "bg-[#af601a]/10 text-[#af601a]"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <span>{r.emoji}</span>
                {localCounts[r.type] > 0 && <span>{localCounts[r.type]}</span>}
              </button>
            ))}

            <button
              onClick={() => {
                setShowComments((v) => !v);
                if (!showComments) setCommentCount(post.commentCount);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition ml-auto",
                showComments ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <MessageCircle size={14} />
              {commentCount > 0 ? commentCount : "Comment"}
            </button>
          </div>
        </div>

        {/* ── Comments ───────────────────────────────────────────────────────── */}
        {showComments && (
          <CommentSection
            postId={post.id}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            currentUserPhoto={currentUserPhoto}
            onCommentAdded={() => setCommentCount((n) => n + 1)}
          />
        )}
      </article>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          onSubmit={async (reason, notes) => {
            await reportContent({ postId: post.id, reason, notes });
            setShowReport(false);
          }}
        />
      )}
    </>
  );
}

// ─── PostMenu ─────────────────────────────────────────────────────────────────

function PostMenu({
  isAuthor, isAdmin, postId, onEdit, onDelete, onReport, startTransition,
}: {
  isAuthor: boolean;
  isAdmin: boolean;
  postId: string;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  startTransition: ReturnType<typeof useTransition>[1];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0">
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {isAuthor && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil size={14} className="mr-2" /> Edit post
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
              <Trash2 size={14} className="mr-2" /> Delete
            </DropdownMenuItem>
          </>
        )}
        {isAdmin && !isAuthor && (
          <>
            <DropdownMenuItem onClick={() => startTransition(() => void hidePost(postId))}>
              <EyeOff size={14} className="mr-2" /> Hide
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => startTransition(() => void pinPost(postId))}>
              <Pin size={14} className="mr-2" /> Pin
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {isAdmin && isAuthor && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => startTransition(() => void pinPost(postId))}>
              <Pin size={14} className="mr-2" /> Pin
            </DropdownMenuItem>
          </>
        )}
        {!isAuthor && (
          <DropdownMenuItem onClick={onReport}>
            <Flag size={14} className="mr-2" /> Report
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── ReportModal ──────────────────────────────────────────────────────────────

function ReportModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (
    reason: "spam" | "inappropriate" | "harassment" | "misinformation" | "other",
    notes: string
  ) => Promise<void>;
}) {
  const [reason, setReason] = useState<
    "spam" | "inappropriate" | "harassment" | "misinformation" | "other"
  >("spam");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-4">Report post</h3>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as typeof reason)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#af601a]"
        >
          <option value="spam">Spam</option>
          <option value="inappropriate">Inappropriate content</option>
          <option value="harassment">Harassment</option>
          <option value="misinformation">Misinformation</option>
          <option value="other">Other</option>
        </select>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional details (optional)"
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#af601a] mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => startTransition(() => onSubmit(reason, notes))}
            disabled={isPending}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {isPending ? "Sending…" : "Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
