// ============================================================
// CloudOps Query Client — Single TanStack Query instance
// Every commit imports THIS client, never creates its own.
// ============================================================

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,          // 30s before re-fetch
            gcTime: 5 * 60_000,        // 5min garbage collection
            retry: 1,                   // Retry once on failure
            refetchOnWindowFocus: false, // Don't spam on tab switch
        },
        mutations: {
            retry: 0,
        },
    },
});
