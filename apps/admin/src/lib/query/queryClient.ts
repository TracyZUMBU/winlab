import { QueryCache, QueryClient } from "@tanstack/react-query";

import { handleQueryCacheError } from "./queryCacheOnError";

/**
 * Client TanStack Query pour l’app admin (Vite).
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryCacheError,
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
