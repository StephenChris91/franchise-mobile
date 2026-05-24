import { QueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
});

/** Persists the query cache to AsyncStorage so the app loads instantly on cold start */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "FRANCHISE_QUERY_CACHE",
  throttleTime: 1000,
});
