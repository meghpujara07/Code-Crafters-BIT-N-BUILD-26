// ============================================================
// CloudOps — Fleet-Level Monitoring & Telemetry Page
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    Clock,
    HardDrive,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { MetricsSummary, MetricsTimeseries, Interval } from '../../api/types';
import { MetricChart } from '../../components/charts/MetricChart';

export function MonitoringPage() {
    const [interval, setInterval] = useState<Interval>('5m');
    const [selectedMetric, setSelectedMetric] = useState<string>('request_rate');

    // 1. Summary
    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['metrics', 'summary'],
        queryFn: () => apiClient.get<MetricsSummary>('/metrics/summary'),
    });

    // 2. Active Timeseries
    const { data: timeseries, isLoading: tsLoading } = useQuery({
        queryKey: ['metrics', 'timeseries', selectedMetric, interval],
        queryFn: () => apiClient.get<MetricsTimeseries>(`/metrics/timeseries?metric=${selectedMetric}&interval=${interval}`),
    });

    if (summaryLoading || !summary) {
        return (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading fleet metrics...
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Fleet Monitoring & Telemetry</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Real-time telemetry aggregated across multi-cloud infrastructure</p>
                </div>

                {/* Interval Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Interval:</span>
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

            {/* Metric Summary Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Traffic</span>
                        <Activity size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{summary.traffic.avg.toLocaleString()} req/s</div>
                    <div style={{ fontSize: 12, color: 'var(--success)' }}>+{summary.traffic.changePercent}% vs last hr</div>
                </div>

                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>P95 Latency</span>
                        <Clock size={16} style={{ color: 'var(--warning)' }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{summary.latency.p95Ms} ms</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>P50: {summary.latency.p50Ms}ms • P99: {summary.latency.p99Ms}ms</div>
                </div>

                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fleet Uptime</span>
                        <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{summary.uptimePercent}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target: 99.9% SLO</div>
                </div>

                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Storage Used</span>
                        <HardDrive size={16} style={{ color: 'var(--ai-accent)' }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{summary.storage.usedGb.toLocaleString()} GB</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{summary.storage.utilizationPercent}% of {summary.storage.totalGb.toLocaleString()} GB</div>
                </div>

                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Error Rate</span>
                        <AlertTriangle size={16} style={{ color: summary.errorRate > 1 ? 'var(--error)' : 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{summary.errorRate}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>HTTP 5xx & Failures</div>
                </div>
            </div>

            {/* Main Metric Visualization Panel */}
            <div className="s-card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[
                            { id: 'request_rate', label: 'Request Rate (req/s)' },
                            { id: 'latency_p95_ms', label: 'P95 Latency (ms)' },
                            { id: 'cpu_utilization', label: 'CPU Utilization (%)' },
                            { id: 'storage_utilization', label: 'Storage Utilization (%)' },
                        ].map(m => (
                            <button
                                key={m.id}
                                className={`btn btn-sm ${selectedMetric === m.id ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSelectedMetric(m.id)}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RefreshCw size={12} className="spin" /> Live 60s ingestion
                    </div>
                </div>

                {tsLoading ? (
                    <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Loading time series...
                    </div>
                ) : (
                    <MetricChart
                        series={timeseries?.series || []}
                        height={320}
                        unit={timeseries?.unit}
                        showLegend={true}
                    />
                )}
            </div>
        </div>
    );
}
