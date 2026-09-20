// ============================================================
// CloudOps Mock Data — Users (§11 & §12 RBAC Matrix)
// ============================================================

import { User, Permission } from '../../api/types';

export const ALL_PERMISSIONS: Permission[] = [
    'resources.read',
    'metrics.read',
    'costs.read',
    'recommendations.read',
    'actions.read',
    'policies.read',
    'ai.use',
    'actions.request',
    'actions.approve',
    'budgets.write',
    'audit.read',
    'resources.manage',
    'policies.write',
    'accounts.manage',
    'users.manage',
];

export const MANAGER_PERMISSIONS: Permission[] = [
    'resources.read',
    'metrics.read',
    'costs.read',
    'recommendations.read',
    'actions.read',
    'policies.read',
    'ai.use',
    'actions.request',
    'actions.approve',
    'budgets.write',
    'audit.read',
    'resources.manage',
];

export const DEVOPS_PERMISSIONS: Permission[] = [
    'resources.read',
    'metrics.read',
    'costs.read',
    'recommendations.read',
    'actions.read',
    'policies.read',
    'ai.use',
    'actions.request',
];

export const VIEWER_PERMISSIONS: Permission[] = [
    'resources.read',
    'metrics.read',
    'costs.read',
    'recommendations.read',
    'actions.read',
    'policies.read',
    'ai.use',
];

export const MOCK_USERS: User[] = [
    {
        id: 'usr-admin-01',
        email: 'admin@cloudops.dev',
        name: 'Sarah Connor (Admin)',
        role: 'ADMIN',
        active: true,
        permissions: ALL_PERMISSIONS,
    },
    {
        id: 'usr-manager-01',
        email: 'manager@cloudops.dev',
        name: 'Marcus Vance (Manager)',
        role: 'MANAGER',
        active: true,
        permissions: MANAGER_PERMISSIONS,
    },
    {
        id: 'usr-devops-01',
        email: 'devops@cloudops.dev',
        name: 'Alex Chen (DevOps)',
        role: 'DEVOPS',
        active: true,
        permissions: DEVOPS_PERMISSIONS,
    },
    {
        id: 'usr-viewer-01',
        email: 'viewer@cloudops.dev',
        name: 'Elena Rostova (Viewer)',
        role: 'VIEWER',
        active: true,
        permissions: VIEWER_PERMISSIONS,
    },
];
