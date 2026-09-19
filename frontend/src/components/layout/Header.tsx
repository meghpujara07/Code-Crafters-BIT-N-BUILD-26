// ============================================================
// CloudOps — Top Header Component
// ============================================================

import { Search, Bell, Command, Sparkles, User as UserIcon, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

export function Header() {
    const { user, logout } = useAuthStore();
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <header className="header">
            <div className="header-left">
                <div className="search-input-wrapper" style={{ width: 320 }}>
                    <Search size={15} />
                    <input
                        className="input input-sm search-input"
                        placeholder="Search resources, recommendations, actions..."
                        readOnly
                    />
                    <span className="search-shortcut">
                        <Command size={10} /> K
                    </span>
                </div>

                <div className="system-status-indicator">
                    <div className="system-status-dot" />
                    <span>System Healthy</span>
                </div>
            </div>

            <div className="header-right">
                <button className="icon-btn" title="AI Assistant">
                    <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                </button>

                <button className="icon-btn" title="Notifications">
                    <Bell size={16} />
                </button>

                <div className="user-dropdown">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{ gap: 8 }}
                    >
                        <UserIcon size={14} />
                        <span>{user?.name || 'Account'}</span>
                        <span className="badge badge-ai" style={{ fontSize: 10 }}>{user?.role}</span>
                    </button>

                    {showDropdown && (
                        <div
                            className="tooltip"
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 42,
                                width: 200,
                                zIndex: 100,
                                background: 'var(--surface)',
                                padding: '8px 0',
                            }}
                        >
                            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
                            </div>
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, color: 'var(--error)' }}
                                onClick={() => {
                                    setShowDropdown(false);
                                    logout();
                                }}
                            >
                                <LogOut size={14} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
