// ============================================================
// CloudOps — Permission-Gated Sidebar Navigation
// ============================================================

import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Activity, Server, DollarSign, Sparkles,
    CheckSquare, Shield, Cloud, Bell, FileText, Users,
    AlertTriangle, LogOut, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { Permission } from '../../api/types';
import { CloudOpsLogo } from '../common/CloudOpsLogo';

interface NavItemConfig {
    path: string;
    label: string;
    icon: React.ReactNode;
    permission?: Permission;
}

const OVERVIEW_NAV: NavItemConfig[] = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/monitoring', label: 'Monitoring', icon: <Activity size={18} />, permission: 'metrics.read' },
    { path: '/resources', label: 'Resources', icon: <Server size={18} />, permission: 'resources.read' },
    { path: '/costs', label: 'Costs', icon: <DollarSign size={18} />, permission: 'costs.read' },
];

const WORKFLOW_NAV: NavItemConfig[] = [
    { path: '/recommendations', label: 'Recommendations', icon: <Sparkles size={18} />, permission: 'recommendations.read' },
    { path: '/approvals', label: 'Approvals', icon: <CheckSquare size={18} />, permission: 'actions.read' },
    { path: '/alerts', label: 'Alert Center', icon: <AlertTriangle size={18} />, permission: 'metrics.read' },
];

const MANAGEMENT_NAV: NavItemConfig[] = [
    { path: '/policies', label: 'Policies & Budgets', icon: <Shield size={18} />, permission: 'policies.read' },
    { path: '/accounts', label: 'Cloud Accounts', icon: <Cloud size={18} />, permission: 'accounts.manage' },
    { path: '/settings/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { path: '/audit', label: 'Audit Logs', icon: <FileText size={18} />, permission: 'audit.read' },
    { path: '/admin/users', label: 'User Management', icon: <Users size={18} />, permission: 'users.manage' },
];

function NavItem({ item, isCollapsed }: { item: NavItemConfig; isCollapsed: boolean }) {
    const hasAccess = item.permission ? usePermission(item.permission) : true;
    if (!hasAccess) return null;

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed-item' : ''}`}
            title={isCollapsed ? item.label : undefined}
        >
            <div className="nav-item-icon">{item.icon}</div>
            {!isCollapsed && <span className="nav-item-text">{item.label}</span>}
        </NavLink>
    );
}

export function Sidebar() {
    const { user, logout } = useAuthStore();
    const { isCollapsed, toggleSidebar } = useSidebarStore();

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Header / Brand */}
            <div className="sidebar-brand">
                <div className="brand-logo-wrapper">
                    <CloudOpsLogo size="md" />
                    {!isCollapsed && <span className="sidebar-title">CloudOps</span>}
                </div>

                <button
                    className="sidebar-toggle-btn"
                    onClick={toggleSidebar}
                    title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    aria-label="Toggle Sidebar"
                >
                    {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
            </div>

            {/* Navigation items */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    {!isCollapsed && <div className="nav-section-title">Overview</div>}
                    {OVERVIEW_NAV.map(item => (
                        <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
                    ))}
                </div>

                <div className="nav-section">
                    {!isCollapsed && <div className="nav-section-title">Automation & Operations</div>}
                    {WORKFLOW_NAV.map(item => (
                        <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
                    ))}
                </div>

                <div className="nav-section">
                    {!isCollapsed && <div className="nav-section-title">Governance & Admin</div>}
                    {MANAGEMENT_NAV.map(item => (
                        <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
                    ))}
                </div>
            </nav>

            {/* Footer / User profile */}
            <div className="sidebar-footer">
                <div className="user-mini" title={isCollapsed ? `${user?.name || 'User'} (${user?.role || 'VIEWER'})` : undefined}>
                    <div className="user-avatar">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {!isCollapsed && (
                        <div className="user-details">
                            <span className="user-name">{user?.name || 'User'}</span>
                            <span className="user-role-badge">{user?.role || 'VIEWER'}</span>
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <button
                        className="icon-btn logout-btn"
                        title="Sign Out"
                        onClick={() => logout()}
                    >
                        <LogOut size={16} />
                    </button>
                )}
            </div>
        </aside>
    );
}

