// ============================================================
// CloudOps — Recommendations Page
// Redesigned to match Executive Dashboard container layout & CSS Studio theme
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Sparkles,
    Search,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    ShieldAlert,
    CheckCircle2,
    ChevronRight,
    Layers,
    RotateCcw,
    Zap,
    DollarSign,
    Cloud,
    SlidersHorizontal,
} from 'lucide-react';
import { Recommendation, Provider } from '../../api/types';
import { apiClient } from '../../api/client';
import { ReviewDrawer } from './ReviewDrawer';

export function RecommendationsPage() {
    const [search, setSearch] = useState('');
    const [provider, setProvider] = useState<string>('ALL');
    const [statusTab, setStatusTab] = useState<string>('ALL');
    const [type, setType] = useState<string>('ALL');
    const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

    const { data: recommendations, isLoading, refetch } = useQuery<Recommendation[]>({
        queryKey: ['recommendations', { provider, statusTab, type }],
        queryFn: async () => {
            const res = await apiClient.get<{ data: Recommendation[]; meta: any }>('/recommendations');
            return res.data;
        },
    });

    const allRecs = recommendations || [];

    // KPI Calculations
    const stats = useMemo(() => {
        const total = allRecs.length;
        const newCount = allRecs.filter(r => r.status === 'NEW').length;
        const acceptedCount = allRecs.filter(r => r.status === 'ACCEPTED').length;
        const dismissedCount = allRecs.filter(r => r.status === 'DISMISSED').length;

        const netImpact = allRecs.reduce((acc, r) => acc + (r.costImpact?.deltaMonthlyUsd || 0), 0);
        const criticalCount = allRecs.filter(r => r.severity === 'CRITICAL' || r.severity === 'WARNING').length;
        const avgConfidence = total > 0 ? Math.round(allRecs.reduce((acc, r) => acc + r.confidence, 0) / total) : 0;

        return { total, newCount, acceptedCount, dismissedCount, netImpact, criticalCount, avgConfidence };
    }, [allRecs]);

    // Filtering
    const filteredRecs = useMemo(() => {
        return allRecs.filter(r => {
            if (provider !== 'ALL' && r.provider !== provider) return false;
            if (statusTab !== 'ALL' && r.status !== statusTab) return false;
            if (type !== 'ALL' && r.type !== type) return false;
            if (search) {
                const query = search.toLowerCase();
                return (
                    r.title.toLowerCase().includes(query) ||
                    r.resourceName.toLowerCase().includes(query) ||
                    r.summary.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [allRecs, provider, statusTab, type, search]);

    const hasActiveFilters = search || provider !== 'ALL' || statusTab !== 'ALL' || type !== 'ALL';

    const resetFilters = () => {
        setSearch('');
        setProvider('ALL');
        setStatusTab('ALL');
        setType('ALL');
    };

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Hero Header Banner (Matches Dashboard Hero) */}
            <div className="s-hero" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Sparkles size={20} style={{ color: 'var(--ai-accent)' }} />
                            <h1 className="s-hero-title" style={{ margin: 0 }}>Optimization Recommendations</h1>
                        </div>
                        <p className="s-hero-subtitle" style={{ margin: 0 }}>
                            Policy-safe & AI-analyzed infrastructure optimizations across AWS, Azure, and GCP
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" onClick={() => refetch()} style={{ gap: 6 }}>
                            <RotateCcw size={14} /> Refresh Stream
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards Strip (Matches Dashboard KPI Strip) */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {/* Total Recommendations */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Active Recommendations
                        </span>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(167, 139, 250, 0.1)',
                                color: 'var(--ai-accent)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Zap size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats.total}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--warning)' }}>{stats.newCount} New</span> • {stats.acceptedCount} Accepted
                    </div>
                </div>

                {/* Net Monthly Impact */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Net Monthly Impact
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
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: 28,
                            fontWeight: 600,
                            marginBottom: 4,
                            color: stats.netImpact <= 0 ? 'var(--success)' : 'var(--error)',
                        }}
                    >
                        {stats.netImpact <= 0 ? '-' : '+'}${Math.abs(stats.netImpact).toFixed(2)}
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Estimated net cloud spend impact
                    </div>
                </div>

                {/* Action Items */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Action Items
                        </span>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(245, 158, 11, 0.1)',
                                color: 'var(--warning)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ShieldAlert size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats.criticalCount}</div>
                    <div style={{ fontSize: 12, color: 'var(--warning)' }}>
                        Requires priority review or scaling
                    </div>
                </div>

                {/* AI Confidence */}
                <div className="s-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                            Model Precision
                        </span>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(129, 140, 248, 0.1)',
                                color: 'var(--accent)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats.avgConfidence}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Average trigger confidence score
                    </div>
                </div>
            </div>

            {/* Filter Toolbar & Status Tabs Panel */}
            <div className="s-card" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Tab Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {[
                            { id: 'ALL', label: 'All', count: stats.total },
                            { id: 'NEW', label: 'New', count: stats.newCount },
                            { id: 'ACCEPTED', label: 'Accepted', count: stats.acceptedCount },
                            { id: 'DISMISSED', label: 'Dismissed', count: stats.dismissedCount },
                        ].map(tab => {
                            const active = statusTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatusTab(tab.id)}
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
                                            background: active ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                            color: active ? 'var(--ai-accent)' : 'var(--text-muted)',
                                        }}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {hasActiveFilters && (
                        <button onClick={resetFilters} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
                            <RotateCcw size={12} /> Reset Filters
                        </button>
                    )}
                </div>

                {/* Filter Inputs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={15} />
                        <input
                            type="text"
                            className="s-input search-input"
                            placeholder="Search by title, resource name, or summary..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <select className="s-select" value={provider} onChange={e => setProvider(e.target.value)}>
                        <option value="ALL">All Cloud Providers</option>
                        <option value="AWS">Amazon Web Services (AWS)</option>
                        <option value="AZURE">Microsoft Azure</option>
                        <option value="GCP">Google Cloud Platform (GCP)</option>
                    </select>

                    <select className="s-select" value={type} onChange={e => setType(e.target.value)}>
                        <option value="ALL">All Action Types</option>
                        <option value="SCALE_UP">Scale Up</option>
                        <option value="SCALE_DOWN">Scale Down</option>
                        <option value="RIGHT_SIZE">Right Size</option>
                        <option value="COST_OPTIMIZATION">Cost Optimization</option>
                        <option value="RESOURCE_ALLOCATION">Resource Allocation</option>
                    </select>
                </div>
            </div>

            {/* Recommendations Feed List */}
            {isLoading ? (
                <div className="s-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading recommendations...
                </div>
            ) : filteredRecs.length === 0 ? (
                <div className="s-card" style={{ padding: 56, textAlign: 'center' }}>
                    <Layers size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <h3 style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                        No recommendations match your selected filters
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                        Try resetting your search query or switching status tabs.
                    </p>
                    {hasActiveFilters && (
                        <button onClick={resetFilters} className="btn btn-secondary btn-sm" style={{ margin: '0 auto' }}>
                            <RotateCcw size={13} /> Clear All Filters
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredRecs.map(rec => {
                        const isIncrease = rec.costImpact.deltaMonthlyUsd > 0;
                        const isDecrease = rec.costImpact.deltaMonthlyUsd < 0;

                        const severityBadgeClass =
                            rec.severity === 'CRITICAL'
                                ? 'badge-error'
                                : rec.severity === 'WARNING'
                                    ? 'badge-warning'
                                    : 'badge-neutral';

                        return (
                            <div
                                key={rec.id}
                                className="s-card"
                                onClick={() => setSelectedRec(rec)}
                                style={{
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 20,
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease, border-color 0.15s ease',
                                    background: 'var(--surface-raised)',
                                    border: '1px solid var(--border-subtle)',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-tertiary)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)';
                                }}
                            >
                                {/* Left Side Content */}
                                <div style={{ flex: 1 }}>
                                    {/* Badges Bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span className={`badge ${severityBadgeClass}`}>{rec.severity}</span>
                                        <span className="badge badge-neutral">{rec.provider}</span>
                                        <span className="badge badge-ai">{rec.type.replace('_', ' ')}</span>
                                        <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                                            {rec.status}
                                        </span>
                                    </div>

                                    {/* Title & Description */}
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                                        {rec.title}
                                    </h3>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.45 }}>
                                        {rec.summary}
                                    </p>

                                    {/* Details Sub-row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                                        <span>
                                            Target Resource: <strong style={{ color: 'var(--text-secondary)' }}>{rec.resourceName}</strong>
                                        </span>
                                        <span>•</span>
                                        <span style={{ color: 'var(--ai-accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Sparkles size={12} /> {rec.confidence}% AI Confidence
                                        </span>
                                    </div>
                                </div>

                                {/* Right Side Cost & Button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                                            Monthly Cost Impact
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 16,
                                                fontWeight: 600,
                                                marginTop: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: 4,
                                                color: isDecrease ? 'var(--success)' : isIncrease ? 'var(--error)' : 'var(--text-muted)',
                                            }}
                                        >
                                            {isIncrease ? <ArrowUpRight size={16} /> : isDecrease ? <ArrowDownRight size={16} /> : null}
                                            {isIncrease ? '+' : ''}${Math.abs(rec.costImpact.deltaMonthlyUsd).toFixed(2)}/mo
                                        </div>
                                    </div>

                                    <button className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                                        Review <Sparkles size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Review Drawer Component */}
            {selectedRec && (
                <ReviewDrawer
                    recommendation={selectedRec}
                    onClose={() => setSelectedRec(null)}
                    onAccepted={() => {
                        refetch();
                    }}
                    onDismissed={() => {
                        refetch();
                    }}
                />
            )}
        </div>
    );
}
