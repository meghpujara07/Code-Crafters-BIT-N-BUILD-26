// ============================================================
// CloudOps — Single Resource Detailed View Page
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    Server,
    Activity,
    ShieldCheck,
    DollarSign,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Clock,
    Layers,
    Sliders,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import {
    Resource,
    ResourceMetrics,
    ResourceHealthDetail,
    ResourceCost,
    Interval,
} from '../../api/types';
import { MetricChart } from '../../components/charts/MetricChart';
import { ScaleResourceModal } from './ScaleResourceModal';

export function ResourceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'metrics' | 'health' | 'cost'>('metrics');
    const [interval, setInterval] = useState<Interval>('5m');
    const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);

    // 1. Resource overview
    const { data: resource, isLoading: resLoading } = useQuery({
        queryKey: ['resource', id],
        queryFn: () => apiClient.get<Resource>(`/resources/${id}`),
    });

    // 2. Telemetry metrics
    const { data: metrics } = useQuery({
        queryKey: ['resource', id, 'metrics', interval],
        queryFn: () => apiClient.get<ResourceMetrics>(`/resources/${id}/metrics?interval=${interval}`),
        enabled: !!id,
    });

    // 3. Health detail
    const { data: healthDetail } = useQuery({
        queryKey: ['resource', id, 'health'],
        queryFn: () => apiClient.get<ResourceHealthDetail>(`/resources/${id}/health`),
        enabled: !!id,
    });

    // 4. Cost detail
    const { data: costDetail } = useQuery({
        queryKey: ['resource', id, 'cost'],
        queryFn: () => apiClient.get<ResourceCost>(`/resources/${id}/cost`),
        enabled: !!id,
    });

    if (resLoading || !resource) {
        return (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading resource detail...
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Back Button */}
            <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/resources')}
                style={{ marginBottom: 16, gap: 6 }}
            >
                <ArrowLeft size={14} /> Back to Resources
            </button>

            {/* Header Block */}
            <div className="s-card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 10,
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: 'var(--accent)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Server size={24} />
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <h1 style={{ fontSize: 20, fontWeight: 600 }}>{resource.name}</h1>
                                <span className="badge badge-neutral">{resource.provider}</span>
                                <span className="badge badge-neutral">{resource.type}</span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                ID: {resource.id} • Region: {resource.region} • Account: {resource.accountId}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setIsScaleModalOpen(true)}
                            style={{ gap: 6 }}
                        >
                            <Sliders size={14} /> Scale Capacity
                        </button>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Monthly Cost</div>
                            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
                                ${resource.monthlyCostUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 24, gap: 16 }}>
                {[
                    { id: 'metrics', label: 'Telemetry & Metrics', icon: Activity },
                    { id: 'health', label: 'Health & Diagnostics', icon: ShieldCheck },
                    { id: 'cost', label: 'Cost Breakdown', icon: DollarSign },
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '12px 16px',
                                background: 'none',
                                border: 'none',
                                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                fontWeight: isActive ? 600 : 400,
                                fontSize: 14,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab 1: Telemetry & Metrics */}
            {activeTab === 'metrics' && (
                <div className="s-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Performance Telemetry</h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interval:</span>
                            {(['1m', '5m', '15m', '1h', '1d'] as Interval[]).map(i => (
                                <button
                                    key={i}
                                    className={`btn btn-sm ${interval === i ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setInterval(i)}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                        {metrics?.series ? (
                            metrics.series.map(s => (
                                <div key={s.metric} style={{ background: 'var(--surface-raised)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                                    <MetricChart
                                        series={[s]}
                                        height={200}
                                        unit={s.unit}
                                        title={s.metric.replace(/_/g, ' ').toUpperCase()}
                                    />
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                Loading metric series...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab 2: Health & Diagnostics */}
            {activeTab === 'health' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                    <div className="s-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Diagnostic Check Results</h3>
                        {healthDetail?.checks ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {healthDetail.checks.map((chk, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: 16,
                                            borderRadius: 8,
                                            background: 'var(--surface-raised)',
                                            border: '1px solid var(--border-subtle)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{chk.name}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{chk.message}</div>
                                        </div>
                                        {chk.status === 'PASS' && (
                                            <span className="badge badge-success" style={{ gap: 4 }}>
                                                <CheckCircle size={12} /> PASS
                                            </span>
                                        )}
                                        {chk.status === 'WARN' && (
                                            <span className="badge badge-warning" style={{ gap: 4 }}>
                                                <AlertTriangle size={12} /> WARN
                                            </span>
                                        )}
                                        {chk.status === 'FAIL' && (
                                            <span className="badge badge-error" style={{ gap: 4 }}>
                                                <XCircle size={12} /> FAIL
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)' }}>Loading health checks...</div>
                        )}
                    </div>

                    <div className="s-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Health Overview</h3>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Current Status</div>
                            <span className={`badge ${resource.health === 'HEALTHY' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 13, padding: '4px 10px' }}>
                                {resource.health}
                            </span>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Uptime SLA</div>
                            <div style={{ fontSize: 20, fontWeight: 600 }}>{healthDetail?.uptimePercent || 99.98}%</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Last Incident</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {healthDetail?.lastIncidentAt ? new Date(healthDetail.lastIncidentAt).toLocaleString() : 'None in past 30 days'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 3: Cost Breakdown */}
            {activeTab === 'cost' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                    <div className="s-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Daily Cost Trend (Last 14 Days)</h3>
                        {costDetail?.dailyCosts ? (
                            <MetricChart
                                series={[
                                    {
                                        metric: 'daily_cost',
                                        unit: 'USD',
                                        points: costDetail.dailyCosts.map(d => ({ t: d.date, v: d.amountUsd })),
                                    },
                                ]}
                                height={260}
                                unit="$"
                            />
                        ) : (
                            <div style={{ color: 'var(--text-muted)' }}>Loading cost trend...</div>
                        )}
                    </div>

                    <div className="s-card" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Cost Summary</h3>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Month-to-Date Spend</div>
                            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
                                ${costDetail?.monthToDateUsd.toFixed(2) || '0.00'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Forecast End of Month</div>
                            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent)' }}>
                                ${costDetail?.forecastUsd.toFixed(2) || '0.00'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ScaleResourceModal
                resource={resource}
                isOpen={isScaleModalOpen}
                onClose={() => setIsScaleModalOpen(false)}
            />
        </div>
    );
}
