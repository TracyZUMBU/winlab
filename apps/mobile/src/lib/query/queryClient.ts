import { QueryClient } from "@tanstack/react-query";

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
  defaultOptions,
});
