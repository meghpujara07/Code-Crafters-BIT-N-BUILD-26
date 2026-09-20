// ============================================================
// CloudOps — Unified Alert Center Page
// Sub-commit 5.1: Incident feed, anomaly notifications & resolution workflow
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ShieldAlert,
    AlertTriangle,
    Info,
    CheckCircle2,
    Clock,
    Filter,
    Search,
    Bell,
    Check,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Alert, Severity } from '../../api/types';
import { toast } from 'sonner';

export function AlertCenterPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'>('OPEN');
    const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');

    // Fetch Alerts
    const { data: alertsResponse, isLoading } = useQuery<any>({
        queryKey: ['alerts'],
        queryFn: () => apiClient.get('/alerts'),
    });

    const alerts: Alert[] = Array.isArray(alertsResponse)
        ? alertsResponse
        : alertsResponse?.data || [];

    // Acknowledge Mutation
    const acknowledgeMutation = useMutation({
        mutationFn: (id: string) => apiClient.post(`/alerts/${id}/acknowledge`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            toast.success('Alert acknowledged');
        },
    });

    // Resolve Mutation
    const resolveMutation = useMutation({
        mutationFn: (id: string) => apiClient.post(`/alerts/${id}/resolve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            toast.success('Alert marked as resolved');
        },
    });

    const filteredAlerts = alerts.filter(a => {
        const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
        const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
        return matchesStatus && matchesSeverity;
    });

    const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'OPEN').length;
    const warningCount = alerts.filter(a => a.severity === 'WARNING' && a.status === 'OPEN').length;

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Hero Header */}
            <div className="s-hero" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span className="badge badge-accent">Incident Management</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Real-time Feed</span>
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                            Unified Alert & Incident Center
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                            Track anomaly detection signals, health degradations, budget threshold breaches, and system incidents.
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Summary Strip */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <div className="s-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Open Critical Incidents</span>
                        <ShieldAlert size={16} style={{ color: 'var(--error)' }} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--error)' }}>{criticalCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Requires immediate action</div>
                </div>

                <div className="s-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Open Warnings</span>
                        <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--warning)' }}>{warningCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Anomalies & threshold alerts</div>
                </div>

                <div className="s-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Feed Items</span>
                        <Bell size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{alerts.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Active & archived</div>
                </div>
            </div>

            {/* Filter Bar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                    gap: 12,
                }}
            >
                {/* Status Tabs */}
                <div style={{ display: 'flex', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border)' }}>
                    {(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            style={{
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 500,
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: statusFilter === tab ? 'var(--surface)' : 'transparent',
                                color: statusFilter === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            {tab === 'OPEN' ? 'Open Alerts' : tab === 'ACKNOWLEDGED' ? 'Acknowledged' : tab === 'RESOLVED' ? 'Resolved' : 'All Alerts'}
                        </button>
                    ))}
                </div>

                {/* Severity Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Severity:</span>
                    {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(sev => (
                        <button
                            key={sev}
                            onClick={() => setSeverityFilter(sev)}
                            style={{
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 500,
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${severityFilter === sev ? 'var(--accent)' : 'var(--border)'}`,
                                background: severityFilter === sev ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-secondary)',
                                color: severityFilter === sev ? 'var(--accent)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                            }}
                        >
                            {sev}
                        </button>
                    ))}
                </div>
            </div>

            {/* Alert Cards Feed */}
            {isLoading ? (
                <div className="s-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading alert feed...
                </div>
            ) : filteredAlerts.length === 0 ? (
                <div className="s-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={32} style={{ color: 'var(--success)', marginBottom: 8 }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>No alerts found</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>All system signals and metrics are operating within normal parameters.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredAlerts.map(alert => {
                        const isCritical = alert.severity === 'CRITICAL';
                        const isWarning = alert.severity === 'WARNING';
                        return (
                            <div
                                key={alert.id}
                                className="s-card"
                                style={{
                                    padding: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderLeft: `4px solid ${isCritical ? 'var(--error)' : isWarning ? 'var(--warning)' : 'var(--accent)'}`,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 'var(--radius-md)',
                                            background: isCritical ? 'rgba(255, 77, 106, 0.12)' : isWarning ? 'rgba(255, 176, 32, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                                            color: isCritical ? 'var(--error)' : isWarning ? 'var(--warning)' : 'var(--accent)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginTop: 2,
                                        }}
                                    >
                                        {isCritical ? <ShieldAlert size={20} /> : isWarning ? <AlertTriangle size={20} /> : <Info size={20} />}
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                {alert.title}
                                            </h3>
                                            <span className={`badge ${isCritical ? 'badge-error' : isWarning ? 'badge-warning' : 'badge-accent'}`}>
                                                {alert.severity}
                                            </span>
                                            <span className="badge badge-neutral">{alert.source}</span>
                                            <span className="badge badge-neutral" style={{ textTransform: 'lowercase' }}>
                                                {alert.status}
                                            </span>
                                        </div>

                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 6px 0' }}>
                                            {alert.message}
                                        </p>

                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Clock size={12} />
                                            <span>{new Date(alert.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {alert.status === 'OPEN' && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => acknowledgeMutation.mutate(alert.id)}
                                            disabled={acknowledgeMutation.isPending}
                                            style={{ fontSize: 11 }}
                                        >
                                            Acknowledge
                                        </button>
                                    )}

                                    {alert.status !== 'RESOLVED' && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => resolveMutation.mutate(alert.id)}
                                            disabled={resolveMutation.isPending}
                                            style={{ fontSize: 11, gap: 4 }}
                                        >
                                            <Check size={12} /> Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
