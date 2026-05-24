/**
 * Optimistic reaction toggle hook.
 *
 * Strategy:
 *  - onMutate: immediately flip the reactionCounts + userReactions in every
 *    cached page that contains the post, AND in the single-post detail cache.
 *  - onError:  roll back to the snapshot we saved.
 *  - onSettled: always re-validate (quiet background refetch).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { PostResponse, PaginatedResponse } from "@franchise/types";
import { api } from "../api/client";
import { queryKeys } from "../query/keys";

type ReactionType = "like" | "amen" | "praying" | "heart";

function applyReactionToggle(
  post: PostResponse,
  type: ReactionType
): PostResponse {
  const hasReacted = post.userReactions.includes(type);
  const delta = hasReacted ? -1 : 1;

  return {
    ...post,
    userReactions: hasReacted
      ? post.userReactions.filter((r) => r !== type)
      : [...post.userReactions, type],
    reactionCounts: {
      ...post.reactionCounts,
      [type]: Math.max(0, (post.reactionCounts[type] ?? 0) + delta),
    },
    reactionCount: Math.max(0, post.reactionCount + delta),
  };
}

export function useReact(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (type: ReactionType) => api.posts.react(postId, type),

    onMutate: async (type) => {
      // Cancel any in-flight queries that could overwrite our optimistic state
      await qc.cancelQueries({ queryKey: queryKeys.posts.all });

      // ── Snapshot ─────────────────────────────────────────────────────────
      const snapshotDetail = qc.getQueryData<PostResponse>(
        queryKeys.posts.detail(postId)
      );

      // Snapshot all feed pages (we don't know which list key it's in)
      const listSnapshots: Array<{
        key: readonly unknown[];
        data: InfiniteData<PaginatedResponse<PostResponse>>;
      }> = [];

      qc.getQueriesData<InfiniteData<PaginatedResponse<PostResponse>>>({
        queryKey: queryKeys.posts.all,
        exact: false,
      }).forEach(([key, data]) => {
        if (data) listSnapshots.push({ key, data });
      });

      // ── Optimistic update — detail cache ─────────────────────────────────
      if (snapshotDetail) {
        qc.setQueryData<PostResponse>(
          queryKeys.posts.detail(postId),
          applyReactionToggle(snapshotDetail, type)
        );
      }

      // ── Optimistic update — every paged list that contains this post ─────
      for (const { key, data } of listSnapshots) {
        qc.setQueryData<InfiniteData<PaginatedResponse<PostResponse>>>(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            data: page.data.map((p) =>
              p.id === postId ? applyReactionToggle(p, type) : p
            ),
          })),
        });
      }

      return { snapshotDetail, listSnapshots };
    },

    onError: (_err, _type, ctx) => {
      if (!ctx) return;
      // Restore detail
      if (ctx.snapshotDetail) {
        qc.setQueryData(queryKeys.posts.detail(postId), ctx.snapshotDetail);
      }
      // Restore list pages
      for (const { key, data } of ctx.listSnapshots) {
        qc.setQueryData(key, data);
      }
    },

    onSettled: () => {
      // Quiet background revalidation
      qc.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
    },
  });
}
