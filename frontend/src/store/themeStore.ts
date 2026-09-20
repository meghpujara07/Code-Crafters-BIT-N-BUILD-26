// ============================================================
// CloudOps — Dark / Light Mode Theme Store
// ============================================================

import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
}

const getInitialTheme = (): ThemeMode => {
    const saved = localStorage.getItem('cloudops_theme') as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
        return saved;
    }
    return 'dark'; // Default to OLED Dark Mode
};

const applyThemeToDOM = (theme: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', theme);
};

// Apply on module load
const initialTheme = getInitialTheme();
applyThemeToDOM(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
    theme: initialTheme,
    toggleTheme: () => set((state) => {
        const nextTheme: ThemeMode = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('cloudops_theme', nextTheme);
        applyThemeToDOM(nextTheme);
        return { theme: nextTheme };
    }),
    setTheme: (newTheme: ThemeMode) => {
        localStorage.setItem('cloudops_theme', newTheme);
        applyThemeToDOM(newTheme);
        set({ theme: newTheme });
    },
}));
