// ============================================================
// CloudOps — Sidebar Collapse State Store
// ============================================================

import { create } from 'zustand';

interface SidebarState {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    isCollapsed: localStorage.getItem('cloudops_sidebar_collapsed') === 'true',
    toggleSidebar: () => set((state) => {
        const next = !state.isCollapsed;
        localStorage.setItem('cloudops_sidebar_collapsed', String(next));
        return { isCollapsed: next };
    }),
    setCollapsed: (collapsed: boolean) => {
        localStorage.setItem('cloudops_sidebar_collapsed', String(collapsed));
        set({ isCollapsed: collapsed });
    },
}));
