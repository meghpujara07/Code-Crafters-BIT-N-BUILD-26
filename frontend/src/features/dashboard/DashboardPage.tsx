// ============================================================
// CloudOps — Executive Control Plane Dashboard
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Server,
    DollarSign,
    ShieldCheck,
    Zap,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    AlertTriangle,
    Bot,
    Sparkles,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import {
    DashboardOverview,
    Alert,
    Recommendation,
    MetricsTimeseries,
} from '../../api/types';
import { MetricChart } from '../../components/charts/MetricChart';

export function DashboardPage() {
    const navigate = useNavigate();

    // 1. Overview data
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['dashboard', 'overview'],
        queryFn: () => apiClient.get<DashboardOverview>('/dashboard/overview'),
    });

    // 2. Traffic timeseries
    const { data: trafficSeries } = useQuery({
        queryKey: ['metrics', 'timeseries', 'request_rate'],
        queryFn: () => apiClient.get<MetricsTimeseries>('/metrics/timeseries?metric=request_rate'),
    });

    // 3. Top open alerts
    const { data: alertsData } = useQuery({
        queryKey: ['alerts', 'top'],
        queryFn: () => apiClient.get<Alert[]>('/alerts?status=OPEN&pageSize=5'),
    });

    // 4. Top recommendations
    const { data: recsData } = useQuery({
        queryKey: ['recommendations', 'top'],
        queryFn: () => apiClient.get<Recommendation[]>('/recommendations?status=NEW&pageSize=5'),
    });

    if (overviewLoading || !overview) {
        return (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading control plane metrics...
            </div>
        );
    }

    const formattedMonthCost = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(overview.cost.monthToDateUsd);
    const formattedForecast = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(overview.cost.forecastEndOfMonthUsd);

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Hero Header Banner */}
            <div className="s-hero" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="s-hero-title">Operate every cloud from one intelligent control plane</h1>
                        <p className="s-hero-subtitle">
                            <span>Monitor</span> • <span>Optimize</span> • <span>Scale</span> — across AWS, Azure & GCP
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/monitoring')}
                            style={{ gap: 6 }}
                        >
                            <Activity size={14} /> Fleet Metrics
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/resources')}
                            style={{ gap: 6 }}
                        >
                            <Server size={14} /> View Resources
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
                {/* Total Resources */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Total Resources
                        </span>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(129, 140, 248, 0.1)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Server size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{overview.resources.total}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        AWS {overview.resources.byProvider.AWS} • Azure {overview.resources.byProvider.AZURE} • GCP {overview.resources.byProvider.GCP}
                    </div>
                </div>

                {/* Monthly Cost */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Monthly Cost
                        </span>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{formattedMonthCost}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--success)' }}>
                        <ArrowDownRight size={14} /> 8.2% vs last month
                    </div>
                </div>

                {/* Resource Health */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Resource Health
                        </span>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
                        {overview.resources.byHealth.HEALTHY}/{overview.resources.total}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--success)' }}>{overview.resources.byHealth.HEALTHY} Healthy</span> •{' '}
                        <span style={{ color: 'var(--warning)' }}>{overview.resources.byHealth.DEGRADED} Warn</span> •{' '}
                        <span style={{ color: 'var(--error)' }}>{overview.resources.byHealth.UNHEALTHY} Crit</span>
                    </div>
                </div>

                {/* Active Recommendations */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Active Recommendations
                        </span>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(167, 139, 250, 0.1)', color: 'var(--ai-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{overview.counts.newRecommendations}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Potential savings up to $91.10/mo
                    </div>
                </div>

                {/* Pending Approvals */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Pending Approvals
                        </span>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{overview.counts.pendingApprovals}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Requires Manager / Admin review
                    </div>
                </div>
            </div>

            {/* Main Grid: Charts & AI Widget */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 24 }}>
                {/* Left Column: Traffic Chart */}
                <div className="s-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Fleet Traffic & Request Rate</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aggregate req/s across AWS, Azure, and GCP</p>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/monitoring')}>
                            View Monitoring <ArrowUpRight size={12} />
                        </button>
                    </div>

                    <MetricChart
                        series={trafficSeries?.series || []}
                        height={280}
                        unit="req/s"
                        showLegend={true}
                    />
                </div>

                {/* Right Column: AI Assistant Panel */}
                <div className="s-card" style={{ padding: 24, background: 'var(--surface-overlay)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167, 139, 250, 0.15)', color: 'var(--ai-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>CloudOps AI Assistant</h3>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Infrastructure Insights & Policy Q&A</p>
                        </div>
                    </div>

                    <div
                        style={{
                            padding: 14,
                            borderRadius: 8,
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: 'var(--text-secondary)',
                            marginBottom: 16,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ai-accent)', fontWeight: 500, marginBottom: 6 }}>
                            <Sparkles size={14} /> System Health Summary
                        </div>
                        All 3 multi-cloud accounts connected. Total forecasted spend for this month is <strong>{formattedForecast}</strong> (within budget). 2 new cost recommendations ready for review.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 13 }} onClick={() => navigate('/recommendations')}>
                            Why did our cloud cost increase?
                        </button>
                        <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 13 }} onClick={() => navigate('/resources')}>
                            Which resources are underutilized?
                        </button>
                        <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 13 }} onClick={() => navigate('/costs')}>
                            What should I optimize next?
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Recommendations & Alerts Feed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Active Recommendations Feed */}
                <div className="s-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Top Recommendations</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/recommendations')}>
                            View All
                        </button>
                    </div>

                    {recsData && recsData.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {recsData.map(rec => (
                                <div
                                    key={rec.id}
                                    style={{
                                        padding: 14,
                                        borderRadius: 8,
                                        background: 'var(--surface-raised)',
                                        border: '1px solid var(--border-subtle)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span className="badge badge-ai">{rec.type}</span>
                                            <strong style={{ fontSize: 14 }}>{rec.resourceName}</strong>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{rec.title}</p>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/recommendations')}>
                                        Review
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                            No pending recommendations
                        </div>
                    )}
                </div>

                {/* Open Alerts Feed */}
                <div className="s-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Open System Alerts</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/alerts')}>
                            Alert Center
                        </button>
                    </div>

                    {alertsData && alertsData.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {alertsData.map(alert => (
                                <div
                                    key={alert.id}
                                    style={{
                                        padding: 14,
                                        borderRadius: 8,
                                        background: 'var(--surface-raised)',
                                        border: `1px solid ${alert.severity === 'CRITICAL' ? 'rgba(242, 109, 125, 0.3)' : 'var(--border-subtle)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span className={`badge ${alert.severity === 'CRITICAL' ? 'badge-error' : 'badge-warning'}`}>
                                                {alert.severity}
                                            </span>
                                            <strong style={{ fontSize: 14 }}>{alert.title}</strong>
                                        </div>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{alert.message}</p>
                                    </div>
                                    <AlertTriangle size={16} style={{ color: alert.severity === 'CRITICAL' ? 'var(--error)' : 'var(--warning)' }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                            All systems healthy — no active alerts
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
