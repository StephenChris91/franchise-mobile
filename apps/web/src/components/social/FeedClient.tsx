"use client";

import { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { getPusherClient } from "@/lib/pusher-client";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { SocialPost, Group } from "../../../db/schema";

export interface PostWithMeta {
  post: SocialPost;
  author: { name: string; username: string; photoUrl?: string | null };
  group?: Pick<Group, "id" | "name" | "slug"> | null;
  reactionCounts: { like: number; amen: number; praying: number; heart: number };
  userReactions: string[];
}

interface Props {
  initialPosts: PostWithMeta[];
  currentUserId?: string;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserPhoto?: string | null;
  groupId?: string | null;
  postType?: string;
  loadMoreAction: (cursor: string) => Promise<PostWithMeta[]>;
  myPosts?: PostWithMeta[];
}

export default function FeedClient({
  initialPosts,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserPhoto,
  groupId,
  postType: _postType,
  loadMoreAction,
  myPosts = [],
}: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(
    initialPosts[initialPosts.length - 1]?.post.createdAt?.toISOString() ?? ""
  );
  const [hasMore, setHasMore] = useState(initialPosts.length === 20);
  const [loading, setLoading] = useState(false);
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  // Pusher: listen for new posts from other users
  useEffect(() => {
    const channel = groupId ? `feed-${groupId}` : "feed-main";
    const pusher = getPusherClient();
    const ch = pusher.subscribe(channel);
    ch.bind("new-post", ({ postId }: { postId: string }) => {
      setNewPostIds((s) => new Set(s).add(postId));
    });
    return () => {
      ch.unbind_all();
      pusher.unsubscribe(channel);
    };
  }, [groupId]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading || !hasMore) return;
    setLoading(true);
    try {
      const more = await loadMoreAction(cursor);
      if (more.length < 20) setHasMore(false);
      if (more.length > 0) {
        setPosts((p) => [...p, ...more]);
        setCursor(more[more.length - 1].post.createdAt.toISOString());
      }
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, hasMore, loadMoreAction]);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView, loadMore]);

  const isEmpty = posts.length === 0 && myPosts.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500">
        <p className="text-base font-medium">Nothing here yet</p>
        <p className="text-xs text-gray-400 mt-2">
          &ldquo;Two are better than one.&rdquo; — Ecclesiastes 4:9
        </p>
        <p className="text-sm text-gray-400 mt-1">Be the first to post something.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current user's own posts — appear immediately after posting */}
      {myPosts.map(({ post, author, group, reactionCounts, userReactions }) => (
        <PostCard
          key={`mine-${post.id}`}
          post={post}
          author={author}
          group={group}
          reactionCounts={reactionCounts}
          userReactions={userReactions}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          currentUserName={currentUserName}
          currentUserPhoto={currentUserPhoto}
        />
      ))}

      {newPostIds.size > 0 && (
        <button
          onClick={() => { setNewPostIds(new Set()); window.location.reload(); }}
          className="w-full py-2 bg-[#af601a] text-white text-sm font-medium rounded-full shadow-sm hover:bg-[#c47020] transition"
        >
          {newPostIds.size} new post{newPostIds.size > 1 ? "s" : ""} — tap to refresh
        </button>
      )}

      {posts.map(({ post, author, group, reactionCounts, userReactions }) => (
        <PostCard
          key={post.id}
          post={post}
          author={author}
          group={group}
          reactionCounts={reactionCounts}
          userReactions={userReactions}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          currentUserName={currentUserName}
          currentUserPhoto={currentUserPhoto}
        />
      ))}

      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 space-y-3">
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-4">You&apos;ve seen everything ✓</p>
      )}
    </div>
  );
}
