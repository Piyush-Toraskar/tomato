import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status =
          typeof error === "object" && error !== null && "status" in error
            ? Number((error as { status: unknown }).status)
            : 0;

        if ([400, 401, 403, 404, 409, 422, 429].includes(status)) {
          return false;
        }

        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
