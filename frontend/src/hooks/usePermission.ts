// ============================================================
// CloudOps — Permission Hook (§12 RBAC Gate)
// ============================================================

import { Permission } from '../api/types';
import { useAuthStore } from '../store/authStore';

export function usePermission(permission: Permission): boolean {
    const user = useAuthStore(state => state.user);
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
}

export function useHasAnyPermission(permissions: Permission[]): boolean {
    const user = useAuthStore(state => state.user);
    if (!user || !user.permissions) return false;
    return permissions.some(p => user.permissions.includes(p));
}
