import { QueryClient } from "@tanstack/react-query";

/**
 * Client TanStack Query pour l’app admin (Vite).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
