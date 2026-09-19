// ============================================================
// CloudOps — Permission-Gated Sidebar Navigation
// ============================================================

import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Activity, Server, DollarSign, Sparkles,
    CheckSquare, Shield, Cloud, Bell, FileText, Users,
    AlertTriangle, LogOut
} from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import { useAuthStore } from '../../store/authStore';
import { Permission } from '../../api/types';

interface NavItemConfig {
    path: string;
    label: string;
    icon: React.ReactNode;
    permission?: Permission;
}

const OVERVIEW_NAV: NavItemConfig[] = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { path: '/monitoring', label: 'Monitoring', icon: <Activity size={16} />, permission: 'metrics.read' },
    { path: '/resources', label: 'Resources', icon: <Server size={16} />, permission: 'resources.read' },
    { path: '/costs', label: 'Costs', icon: <DollarSign size={16} />, permission: 'costs.read' },
];

const WORKFLOW_NAV: NavItemConfig[] = [
    { path: '/recommendations', label: 'Recommendations', icon: <Sparkles size={16} />, permission: 'recommendations.read' },
    { path: '/approvals', label: 'Approvals', icon: <CheckSquare size={16} />, permission: 'actions.read' },
    { path: '/alerts', label: 'Alert Center', icon: <AlertTriangle size={16} />, permission: 'metrics.read' },
];

const MANAGEMENT_NAV: NavItemConfig[] = [
    { path: '/policies', label: 'Policies & Budgets', icon: <Shield size={16} />, permission: 'policies.read' },
    { path: '/accounts', label: 'Cloud Accounts', icon: <Cloud size={16} />, permission: 'accounts.manage' },
    { path: '/settings/notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { path: '/audit', label: 'Audit Logs', icon: <FileText size={16} />, permission: 'audit.read' },
    { path: '/admin/users', label: 'User Management', icon: <Users size={16} />, permission: 'users.manage' },
];

function NavItem({ item }: { item: NavItemConfig }) {
    const hasAccess = item.permission ? usePermission(item.permission) : true;
    if (!hasAccess) return null;

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
            {item.icon}
            <span>{item.label}</span>
        </NavLink>
    );
}

export function Sidebar() {
    const { user, logout } = useAuthStore();

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo-icon">
                    <Cloud />
                </div>
                <span className="sidebar-title">CloudOps</span>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">Overview</div>
                    {OVERVIEW_NAV.map(item => (
                        <NavItem key={item.path} item={item} />
                    ))}
                </div>

                <div className="nav-section">
                    <div className="nav-section-title">Automation & Operations</div>
                    {WORKFLOW_NAV.map(item => (
                        <NavItem key={item.path} item={item} />
                    ))}
                </div>

                <div className="nav-section">
                    <div className="nav-section-title">Governance & Admin</div>
                    {MANAGEMENT_NAV.map(item => (
                        <NavItem key={item.path} item={item} />
                    ))}
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="user-mini">
                    <div className="user-avatar">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user?.name || 'User'}</span>
                        <span className="user-role-badge">{user?.role || 'VIEWER'}</span>
                    </div>
                </div>
                <button
                    className="icon-btn"
                    title="Sign Out"
                    onClick={() => logout()}
                >
                    <LogOut size={16} />
                </button>
            </div>
        </aside>
    );
}
