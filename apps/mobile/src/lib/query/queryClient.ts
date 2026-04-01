import { QueryCache, QueryClient } from "@tanstack/react-query";

import { handleQueryCacheError } from "./queryCacheOnError";

/**
 * Configuration globale du QueryClient.
 * Utilisé par QueryClientProvider dans le root layout.
 */
const defaultOptions = {
  queries: {
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  },
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryCacheError,
  }),
  defaultOptions,
});
