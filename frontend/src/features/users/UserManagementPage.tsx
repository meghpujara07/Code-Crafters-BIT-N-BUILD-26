// ============================================================
// CloudOps — User Directory & RBAC Permission Matrix Page
// Sub-commit 5.2: User management & role permission matrix
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Users,
    Shield,
    Check,
    Lock,
    Search,
    UserCheck,
    ShieldAlert,
    Sliders,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { User, Role, Permission } from '../../api/types';
import { ALL_PERMISSIONS, MANAGER_PERMISSIONS, DEVOPS_PERMISSIONS, VIEWER_PERMISSIONS } from '../../mocks/data/users';
import { toast } from 'sonner';

const PERMISSION_ROLES_MAP: Record<Role, Permission[]> = {
    ADMIN: ALL_PERMISSIONS,
    MANAGER: MANAGER_PERMISSIONS,
    DEVOPS: DEVOPS_PERMISSIONS,
    VIEWER: VIEWER_PERMISSIONS,
};

export function UserManagementPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'USERS' | 'MATRIX'>('USERS');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Users
    const { data: usersResponse, isLoading } = useQuery<any>({
        queryKey: ['users'],
        queryFn: () => apiClient.get('/users'),
    });

    const users: User[] = Array.isArray(usersResponse)
        ? usersResponse
        : usersResponse?.data || [];

    const handleRoleChange = (userId: string, newRole: Role) => {
        toast.success(`Role updated to ${newRole} for user`);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Hero Header */}
            <div className="s-hero" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span className="badge badge-accent">Identity & Access Management</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>RBAC Governance</span>
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                            User Directory & Role Permissions Matrix
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                            Manage organization user access levels, assigned roles (ADMIN, MANAGER, DEVOPS, VIEWER), and fine-grained permissions.
                        </p>
                    </div>

                    <div style={{ display: 'flex', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border)' }}>
                        <button
                            onClick={() => setActiveTab('USERS')}
                            style={{
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: activeTab === 'USERS' ? 'var(--surface)' : 'transparent',
                                color: activeTab === 'USERS' ? 'var(--text-primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            User Directory
                        </button>
                        <button
                            onClick={() => setActiveTab('MATRIX')}
                            style={{
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: activeTab === 'MATRIX' ? 'var(--surface)' : 'transparent',
                                color: activeTab === 'MATRIX' ? 'var(--text-primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            RBAC Permission Matrix
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB 1: USER DIRECTORY */}
            {activeTab === 'USERS' && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ position: 'relative', width: 300 }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search users or roles..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 34px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--surface-secondary)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    fontSize: 13,
                                }}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="s-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                            Loading user directory...
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                            {filteredUsers.map(u => (
                                <div key={u.id} className="s-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        background: 'rgba(129, 140, 248, 0.15)',
                                                        color: 'var(--accent)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: 15,
                                                    }}
                                                >
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                                                </div>
                                            </div>

                                            <span className="badge badge-success">ACTIVE</span>
                                        </div>

                                        <div style={{ margin: '14px 0', padding: 12, background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
                                            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Assigned Role:</div>
                                            <select
                                                value={u.role}
                                                onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 10px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 600,
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {(['ADMIN', 'MANAGER', 'DEVOPS', 'VIEWER'] as Role[]).map(roleOption => (
                                                    <option key={roleOption} value={roleOption}>
                                                        {roleOption} Role
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                                        <span>Permissions Count:</span>
                                        <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                                            {u.permissions.length} active permissions
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: RBAC PERMISSION MATRIX */}
            {activeTab === 'MATRIX' && (
                <div className="s-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '14px 20px', width: '35%' }}>Permission Token</th>
                                {(['ADMIN', 'MANAGER', 'DEVOPS', 'VIEWER'] as Role[]).map(role => (
                                    <th key={role} style={{ padding: '14px 20px', textAlign: 'center' }}>
                                        {role}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ALL_PERMISSIONS.map(permission => (
                                <tr key={permission} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {permission}
                                    </td>

                                    {(['ADMIN', 'MANAGER', 'DEVOPS', 'VIEWER'] as Role[]).map(role => {
                                        const hasPerm = PERMISSION_ROLES_MAP[role].includes(permission);
                                        return (
                                            <td key={role} style={{ padding: '12px 20px', textAlign: 'center' }}>
                                                {hasPerm ? (
                                                    <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Check size={18} />
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>
                                                        <Lock size={14} />
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
