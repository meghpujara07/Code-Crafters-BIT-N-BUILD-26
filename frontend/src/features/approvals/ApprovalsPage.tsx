// ============================================================
// CloudOps — Governance & Action Approvals Queue
// Sub-commit 4.2: Pending action approval queue with dry-run details & RBAC
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Clock,
    RotateCcw,
    Search,
    Zap,
    DollarSign,
    AlertTriangle,
    UserCheck,
    Loader2,
    ArrowUpRight,
    Layers,
    Sparkles,
    Ban,
    Check,
} from 'lucide-react';
import { Action, ActionStatus } from '../../api/types';
import { apiClient } from '../../api/client';
import { usePermission } from '../../hooks/usePermission';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export function ApprovalsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL');

    const user = useAuthStore(state => state.user);
    const canApprove = usePermission('actions.approve');

    const [processingId, setProcessingId] = useState<string | null>(null);

    // Fetch actions queue
    const { data: actionsData, isLoading, refetch } = useQuery<Action[]>({
        queryKey: ['actions', 'list'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Action[]; meta: any }>('/actions');
            return res.data;
        },
    });

    const allActions = actionsData || [];

    // KPI Calculations
    const stats = useMemo(() => {
        const pending = allActions.filter(a => a.status === 'PENDING_APPROVAL').length;
        const executing = allActions.filter(a => a.status === 'EXECUTING' || a.status === 'SUCCEEDED').length;
        const rejected = allActions.filter(a => a.status === 'REJECTED' || a.status === 'CANCELLED').length;
        return { pending, executing, rejected, total: allActions.length };
    }, [allActions]);

    // Filtering
    const filteredActions = useMemo(() => {
        return allActions.filter(a => {
            if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
            if (search) {
                const query = search.toLowerCase();
                return (
                    a.resourceName.toLowerCase().includes(query) ||
                    a.id.toLowerCase().includes(query) ||
                    a.requestedBy.name.toLowerCase().includes(query) ||
                    a.type.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [allActions, statusFilter, search]);

    const handleApprove = async (actionId: string) => {
        try {
            setProcessingId(actionId);
            await apiClient.post(`/actions/${actionId}/approve`);
            toast.success('Action approved & execution triggered');
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve action');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (actionId: string) => {
        try {
            setProcessingId(actionId);
            await apiClient.post(`/actions/${actionId}/reject`, { reason: 'Rejected by approver' });
            toast.info('Action rejected');
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject action');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancel = async (actionId: string) => {
        try {
            setProcessingId(actionId);
            await apiClient.post(`/actions/${actionId}/cancel`);
            toast.info('Action cancelled');
            refetch();
        } catch (err: any) {
            toast.error(err.message || 'Failed to cancel action');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Hero Header Banner */}
            <div className="s-hero" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <ShieldCheck size={20} style={{ color: 'var(--warning)' }} />
                            <h1 className="s-hero-title" style={{ margin: 0 }}>Action Approvals Queue</h1>
                        </div>
                        <p className="s-hero-subtitle" style={{ margin: 0 }}>
                            Governance review for high-impact cloud operations, scaling changes, and policy-governed actions
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" onClick={() => refetch()} style={{ gap: 6 }}>
                            <RotateCcw size={14} /> Refresh Queue
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards Strip */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {/* Pending Approvals */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Pending Review
                        </span>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(255, 176, 32, 0.1)',
                                color: 'var(--warning)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Clock size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats.pending}</div>
                    <div style={{ fontSize: 12, color: 'var(--warning)' }}>
                        Requires Manager / Admin sign-off
                    </div>
                </div>

                {/* Executing / Succeeded */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Approved & Executed
                        </span>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(52, 211, 153, 0.1)',
                                color: 'var(--success)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats.executing}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Successfully dispatched actions
                    </div>
                </div>

                {/* Rejected / Cancelled */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Rejected / Cancelled
                        </span>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(255, 77, 106, 0.1)',
                                color: 'var(--error)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <XCircle size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats.rejected}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Policy-declined or cancelled
                    </div>
                </div>

                {/* Your Role Status */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Governance Access
                        </span>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(56, 189, 248, 0.1)',
                                color: 'var(--accent)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <UserCheck size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{user?.role || 'VIEWER'}</div>
                    <div style={{ fontSize: 12, color: canApprove ? 'var(--success)' : 'var(--text-muted)' }}>
                        {canApprove ? '✓ Authorized to approve' : 'Read-only queue view'}
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="s-card" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {[
                            { id: 'PENDING_APPROVAL', label: 'Pending Approval', count: stats.pending },
                            { id: 'EXECUTING', label: 'Executing / Active', count: stats.executing },
                            { id: 'REJECTED', label: 'Rejected', count: stats.rejected },
                            { id: 'ALL', label: 'All Actions', count: stats.total },
                        ].map(tab => {
                            const active = statusFilter === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={`btn ${active ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                                    style={{
                                        background: active ? 'var(--surface-tertiary)' : 'transparent',
                                        borderColor: active ? 'var(--border-strong)' : 'transparent',
                                        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                                    }}
                                >
                                    {tab.label}
                                    <span
                                        style={{
                                            fontSize: 11,
                                            padding: '1px 6px',
                                            borderRadius: 10,
                                            background: active ? 'rgba(255, 176, 32, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                            color: active ? 'var(--warning)' : 'var(--text-muted)',
                                        }}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="search-input-wrapper" style={{ width: 280 }}>
                        <Search className="search-icon" size={15} />
                        <input
                            type="text"
                            className="s-input search-input"
                            placeholder="Search by resource, user, type..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Queue Feed List */}
            {isLoading ? (
                <div className="s-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading approval queue...
                </div>
            ) : filteredActions.length === 0 ? (
                <div className="s-card" style={{ padding: 56, textAlign: 'center' }}>
                    <Layers size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <h3 style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                        No actions found in this status queue
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                        Pending infrastructure scaling actions will appear here for Manager sign-off.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredActions.map(action => {
                        const isPending = action.status === 'PENDING_APPROVAL';
                        const isExecuting = action.status === 'EXECUTING' || action.status === 'SUCCEEDED';
                        const isRejected = action.status === 'REJECTED' || action.status === 'CANCELLED';

                        const statusBadgeClass = isPending
                            ? 'badge-warning'
                            : isExecuting
                                ? 'badge-healthy'
                                : 'badge-error';

                        return (
                            <div
                                key={action.id}
                                className="s-card"
                                style={{
                                    padding: '20px 24px',
                                    background: 'var(--surface-raised)',
                                    border: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16,
                                }}
                            >
                                {/* Header Row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span className={`badge ${statusBadgeClass}`}>{action.status.replace('_', ' ')}</span>
                                            <span className="badge badge-ai">{action.type}</span>
                                            <span className="badge badge-neutral">ID: {action.id}</span>
                                        </div>

                                        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                            Scaling target: <strong style={{ color: 'var(--accent)' }}>{action.resourceName}</strong>
                                        </h3>
                                    </div>

                                    {/* Cost Impact Highlight */}
                                    {action.costImpact && (
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                                                Monthly Cost Impact
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: 600,
                                                    marginTop: 2,
                                                    color: action.costImpact.deltaMonthlyUsd > 0 ? 'var(--error)' : 'var(--success)',
                                                }}
                                            >
                                                {action.costImpact.deltaMonthlyUsd > 0 ? '+' : ''}${action.costImpact.deltaMonthlyUsd.toFixed(2)}/mo
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Dry-run parameters & Details Panel */}
                                <div
                                    style={{
                                        padding: 14,
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--surface-secondary)',
                                        border: '1px solid var(--border)',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr',
                                        gap: 16,
                                        fontSize: 13,
                                    }}
                                >
                                    <div>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                            Requested By
                                        </span>
                                        <strong style={{ color: 'var(--text-primary)' }}>{action.requestedBy.name}</strong>
                                    </div>

                                    <div>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                            Execution Target
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            Target Instances: <strong>{action.params?.targetInstances || 6}</strong>
                                        </span>
                                    </div>

                                    <div>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                            Required Approver Role
                                        </span>
                                        <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
                                            {action.validation?.approverRole || 'MANAGER'}
                                        </span>
                                    </div>
                                </div>

                                {/* Validation Checks summary */}
                                {action.validation?.checks && (
                                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                        {action.validation.checks.map((check, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                                {check.passed ? (
                                                    <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                                                ) : (
                                                    <XCircle size={14} style={{ color: 'var(--error)' }} />
                                                )}
                                                <span style={{ color: 'var(--text-muted)' }}>{check.name}:</span>
                                                <span style={{ color: 'var(--text-secondary)' }}>{check.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Action Controls Row */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingTop: 12,
                                        borderTop: '1px solid var(--border-subtle)',
                                    }}
                                >
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Created {new Date(action.createdAt).toLocaleTimeString()}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => handleCancel(action.id)}
                                                    disabled={processingId === action.id}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReject(action.id)}
                                                    disabled={processingId === action.id}
                                                    className="btn btn-danger btn-sm"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(action.id)}
                                                    disabled={processingId === action.id || !canApprove}
                                                    className="btn btn-primary btn-sm"
                                                    style={{ gap: 6 }}
                                                    title={!canApprove ? 'Requires Manager or Admin role' : 'Approve & trigger execution'}
                                                >
                                                    {processingId === action.id ? (
                                                        <Loader2 size={14} className="spin" />
                                                    ) : (
                                                        <>
                                                            Approve & Execute <Sparkles size={13} />
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        )}

                                        {isExecuting && (
                                            <span className="badge badge-healthy" style={{ gap: 4 }}>
                                                <Check size={12} /> Execution Dispatched
                                            </span>
                                        )}

                                        {isRejected && (
                                            <span className="badge badge-error" style={{ gap: 4 }}>
                                                <Ban size={12} /> Action Terminated
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
