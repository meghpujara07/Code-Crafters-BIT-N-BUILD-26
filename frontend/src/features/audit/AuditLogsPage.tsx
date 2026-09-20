// ============================================================
// CloudOps — Security Audit Trail Page
// Sub-commit 5.2: Immutable audit logs & state diff inspector
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ShieldCheck,
    Search,
    Filter,
    Clock,
    User as UserIcon,
    FileText,
    Eye,
    X,
    Code,
    ChevronRight,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { AuditLog } from '../../api/types';

export function AuditLogsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // Fetch Audit Logs
    const { data: logsResponse, isLoading } = useQuery<any>({
        queryKey: ['audit-logs'],
        queryFn: () => apiClient.get('/audit/logs'),
    });

    const logs: AuditLog[] = Array.isArray(logsResponse)
        ? logsResponse
        : logsResponse?.data || [];

    const filteredLogs = logs.filter(log => {
        const actorName = log.actor?.name || 'System';
        const searchLower = searchQuery.toLowerCase();
        return (
            actorName.toLowerCase().includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower) ||
            log.entityType.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Hero Header */}
            <div className="s-hero" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span className="badge badge-accent">Security & Compliance</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Immutable Ledger</span>
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                            Security Audit Trail
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                            Comprehensive, tamper-resistant log of action approvals, policy edits, credential accesses, and role changes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ position: 'relative', width: 320 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by actor, action, or entity..."
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

                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredLogs.length}</strong> recorded audit events
                </div>
            </div>

            {/* Audit Logs Table Card */}
            {isLoading ? (
                <div className="s-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading audit trail...
                </div>
            ) : (
                <div className="s-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '12px 20px' }}>Timestamp</th>
                                <th style={{ padding: '12px 20px' }}>Actor</th>
                                <th style={{ padding: '12px 20px' }}>Action</th>
                                <th style={{ padding: '12px 20px' }}>Entity Type</th>
                                <th style={{ padding: '12px 20px' }}>Entity ID</th>
                                <th style={{ padding: '12px 20px', textAlign: 'right' }}>State Inspection</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}>
                                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Clock size={12} />
                                            {new Date(log.ts).toLocaleString()}
                                        </div>
                                    </td>

                                    <td style={{ padding: '14px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                                                {log.actor?.name.charAt(0) || 'S'}
                                            </div>
                                            <span>{log.actor?.name || 'System Automated'}</span>
                                        </div>
                                    </td>

                                    <td style={{ padding: '14px 20px' }}>
                                        <span className="badge badge-accent" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                            {log.action}
                                        </span>
                                    </td>

                                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                                        {log.entityType}
                                    </td>

                                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>
                                        {log.entityId || 'N/A'}
                                    </td>

                                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setSelectedLog(log)}
                                            style={{ gap: 4, fontSize: 11 }}
                                        >
                                            <Eye size={12} /> Inspect State Diff
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* State Inspection Modal */}
            {selectedLog && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 640,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-modal)',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Code size={18} style={{ color: 'var(--accent)' }} />
                                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                                    Audit Entry Inspection: {selectedLog.id}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="icon-btn">
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Before Change State</div>
                                    <pre style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, fontSize: 11, color: 'var(--error)', overflowX: 'auto', margin: 0 }}>
                                        {JSON.stringify(selectedLog.before, null, 2) || 'null'}
                                    </pre>
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>After Change State</div>
                                    <pre style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, fontSize: 11, color: 'var(--success)', overflowX: 'auto', margin: 0 }}>
                                        {JSON.stringify(selectedLog.after, null, 2) || 'null'}
                                    </pre>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(null)}>
                                    Close Inspector
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
