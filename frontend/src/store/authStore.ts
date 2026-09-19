// ============================================================
// CloudOps Auth Store — Zustand
// Access token in memory, refresh token in localStorage.
// ============================================================

import { create } from 'zustand';
import type { User } from '@/api/types';

const REFRESH_TOKEN_KEY = 'cloudops_refresh_token';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),

    login: (user, accessToken, refreshToken) => {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        set({ user, accessToken, refreshToken });
    },

    logout: () => {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        set({ user: null, accessToken: null, refreshToken: null });
    },
}));
