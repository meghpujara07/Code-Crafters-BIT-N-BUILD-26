// ============================================================
// CloudOps — Full Route Table (§13.1 of ARCHITECTURE.md)
// ============================================================

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { usePermission } from './hooks/usePermission';
import { Permission } from './api/types';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { PlaceholderPage, NotAuthorizedPage } from './pages/PlaceholderPage';

// ---- Auth Guard ----
function AuthGuard({ children }: { children: React.ReactNode }) {
    const user = useAuthStore(state => state.user);
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

// ---- Permission Guard ----
function PermissionGuard({
    permission,
    children,
}: {
    permission?: Permission;
    children: React.ReactNode;
}) {
    const hasPermission = permission ? usePermission(permission) : true;

    if (!hasPermission) {
        return <NotAuthorizedPage permission={permission} />;
    }

    return <>{children}</>;
}

import { DashboardPage } from './features/dashboard/DashboardPage';
import { MonitoringPage } from './features/monitoring/MonitoringPage';
import { ResourcesListPage } from './features/resources/ResourcesListPage';
import { ResourceDetailPage } from './features/resources/ResourceDetailPage';
import { CostsPage } from './features/costs/CostsPage';
import { RecommendationsPage } from './features/recommendations/RecommendationsPage';
import { ApprovalsPage } from './features/approvals/ApprovalsPage';

export function AppRoutes() {
    return (
        <Routes>
            {/* ---- Public Route ---- */}
            <Route path="/login" element={<LoginPage />} />

            {/* ---- Protected App Shell ---- */}
            <Route
                element={
                    <AuthGuard>
                        <AppLayout />
                    </AuthGuard>
                }
            >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* 1. Dashboard (Commit 3) */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* 2. Monitoring (Commit 3) */}
                <Route
                    path="/monitoring"
                    element={
                        <PermissionGuard permission="metrics.read">
                            <MonitoringPage />
                        </PermissionGuard>
                    }
                />

                {/* 3. Resources List (Commit 3) */}
                <Route
                    path="/resources"
                    element={
                        <PermissionGuard permission="resources.read">
                            <ResourcesListPage />
                        </PermissionGuard>
                    }
                />

                {/* 4. Resource Detail (Commit 3) */}
                <Route
                    path="/resources/:id"
                    element={
                        <PermissionGuard permission="resources.read">
                            <ResourceDetailPage />
                        </PermissionGuard>
                    }
                />

                {/* 5. Costs (Commit 3) */}
                <Route
                    path="/costs"
                    element={
                        <PermissionGuard permission="costs.read">
                            <CostsPage />
                        </PermissionGuard>
                    }
                />

                {/* 6. Recommendations (Commit 4) */}
                <Route
                    path="/recommendations"
                    element={
                        <PermissionGuard permission="recommendations.read">
                            <RecommendationsPage />
                        </PermissionGuard>
                    }
                />

                {/* 7. Approvals (Commit 4) */}
                <Route
                    path="/approvals"
                    element={
                        <PermissionGuard permission="actions.read">
                            <ApprovalsPage />
                        </PermissionGuard>
                    }
                />

                {/* 8. Policies & Budgets (Commit 5) */}
                <Route
                    path="/policies"
                    element={
                        <PermissionGuard permission="policies.read">
                            <PlaceholderPage
                                title="Guardrail Policies & Budgets"
                                description="Safety limits, auto-scaling constraints, and hard budget threshold configuration."
                                milestone="Commit 5 (M3)"
                                permission="policies.read"
                            />
                        </PermissionGuard>
                    }
                />

                {/* 9. Cloud Accounts (Commit 5) */}
                <Route
                    path="/accounts"
                    element={
                        <PermissionGuard permission="accounts.manage">
                            <PlaceholderPage
                                title="Cloud Account Connections"
                                description="AWS, Azure, and GCP provider credential management and synchronization status."
                                milestone="Commit 5 (M3)"
                                permission="accounts.manage"
                            />
                        </PermissionGuard>
                    }
                />

                {/* 10. Alert Center (Commit 5) */}
                <Route
                    path="/alerts"
                    element={
                        <PermissionGuard permission="metrics.read">
                            <PlaceholderPage
                                title="Unified Alert Center"
                                description="Real-time incident feed, health degradation notifications, and anomaly tracking."
                                milestone="Commit 5 (M3)"
                                permission="metrics.read"
                            />
                        </PermissionGuard>
                    }
                />

                {/* 11. Notifications (Commit 5) */}
                <Route
                    path="/settings/notifications"
                    element={
                        <PlaceholderPage
                            title="Notification Channels"
                            description="Email, WhatsApp, and in-app notification routing preferences per event type."
                            milestone="Commit 5 (M3)"
                        />
                    }
                />

                {/* 12. Audit Logs (Commit 5) */}
                <Route
                    path="/audit"
                    element={
                        <PermissionGuard permission="audit.read">
                            <PlaceholderPage
                                title="Security & Audit Trail"
                                description="Immutable audit history of all user actions, policy checks, and scaling operations."
                                milestone="Commit 5 (M3)"
                                permission="audit.read"
                            />
                        </PermissionGuard>
                    }
                />

                {/* 13. User Management (Commit 5) */}
                <Route
                    path="/admin/users"
                    element={
                        <PermissionGuard permission="users.manage">
                            <PlaceholderPage
                                title="User & RBAC Management"
                                description="Team member invitations, role assignments (Admin, Manager, DevOps, Viewer), and permission control."
                                milestone="Commit 5 (M3)"
                                permission="users.manage"
                            />
                        </PermissionGuard>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
}
