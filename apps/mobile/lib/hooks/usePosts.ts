import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { queryKeys } from "../query/keys";

/** Paginated feed — supports groupId and postType filters. */
export function useFeed(params?: { groupId?: string; postType?: string }) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: ({ pageParam, signal }) =>
      api.posts.list(
        {
          groupId: params?.groupId,
          postType: params?.postType,
          cursor: pageParam as string | undefined,
          limit: 20,
        },
        signal
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000, // 30 s
  });
}

/** Paginated prayer wall. */
export function usePrayerWall() {
  return useInfiniteQuery({
    queryKey: queryKeys.prayerWall.list(),
    queryFn: ({ pageParam, signal }) =>
      api.prayerWall.list(
        { cursor: pageParam as string | undefined, limit: 20 },
        signal
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}

/** Single post detail. */
export function usePost(id: string) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: ({ signal }) => api.posts.get(id, signal),
    staleTime: 30_000,
  });
}

/** Comments for a post. */
export function useComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.posts.comments(postId),
    queryFn: ({ signal }) => api.posts.comments.list(postId, signal),
    staleTime: 20_000,
  });
}
