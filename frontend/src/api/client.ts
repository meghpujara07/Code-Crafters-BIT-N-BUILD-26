// ============================================================
// CloudOps API Client — §13.2 #1
// Single REST client with bearer auth, envelope unwrap,
// typed errors, and single in-flight refresh on 401.
// ============================================================

import type { ErrorCode } from './types';
import { useAuthStore } from '@/store/authStore';

// ---- Typed API Error ----

export class ApiError extends Error {
    code: ErrorCode;
    details?: { field?: string; reason: string }[];

    constructor(code: ErrorCode, message: string, details?: { field?: string; reason: string }[]) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.details = details;
    }
}

// ---- Config ----

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// ---- Single in-flight refresh promise ----

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    const { refreshToken, login, logout } = useAuthStore.getState();
    if (!refreshToken) {
        logout();
        return null;
    }

    try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
            logout();
            return null;
        }

        const json = await res.json();
        if (!json.success) {
            logout();
            return null;
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = json.data;
        const currentUser = useAuthStore.getState().user;
        login(user || currentUser!, newAccessToken, newRefreshToken || refreshToken);
        return newAccessToken;
    } catch {
        logout();
        return null;
    }
}

// ---- Core request function ----

interface RequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts?: RequestOptions,
    _isRetry = false,
): Promise<T> {
    // Build URL with query params (no trailing slash)
    const url = new URL(`${BASE_URL}${path}`, window.location.origin);
    if (opts?.params) {
        for (const [key, value] of Object.entries(opts.params)) {
            if (value !== undefined && value !== '') {
                url.searchParams.set(key, String(value));
            }
        }
    }

    // Headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...opts?.headers,
    };

    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Fetch
    const res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: opts?.signal,
    });

    // Handle 401 — refresh once then retry
    if (res.status === 401 && !_isRetry) {
        if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;
        if (newToken) {
            return request<T>(method, path, body, opts, true);
        }

        // Refresh failed — throw so route guard can redirect
        const errorJson = await res.json().catch(() => null);
        throw new ApiError(
            errorJson?.error?.code || 'UNAUTHENTICATED',
            errorJson?.error?.message || 'Authentication required',
            errorJson?.error?.details,
        );
    }

    // Parse response
    const json = await res.json().catch(() => null);

    if (!json) {
        throw new ApiError('INTERNAL_ERROR', `Server returned ${res.status} with no body`);
    }

    // Error envelope
    if (!json.success) {
        throw new ApiError(
            json.error?.code || 'INTERNAL_ERROR',
            json.error?.message || 'Unknown error',
            json.error?.details,
        );
    }

    // Paginated list — return { data, meta }
    if (json.meta) {
        return { data: json.data, meta: json.meta } as T;
    }

    // Single object / plain array — return data
    return json.data as T;
}

// ---- Public API ----

export const apiClient = {
    get<T>(path: string, opts?: RequestOptions): Promise<T> {
        return request<T>('GET', path, undefined, opts);
    },

    post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
        return request<T>('POST', path, body, opts);
    },

    patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
        return request<T>('PATCH', path, body, opts);
    },

    delete<T>(path: string, opts?: RequestOptions): Promise<T> {
        return request<T>('DELETE', path, undefined, opts);
    },
};
