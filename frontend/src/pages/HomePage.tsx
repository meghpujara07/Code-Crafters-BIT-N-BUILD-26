// ============================================================
// CloudOps Premium Dashboard — Commit 1 Placeholder
// CSS Studio aesthetic + Indian heritage influence
// ============================================================

import {
    Cloud, Server, DollarSign, Shield, Activity, Sparkles,
    TrendingDown, TrendingUp, ArrowRight,
    Zap, BarChart3, AlertTriangle, CheckCircle2,
    Monitor, Search, Bell, Command, ChevronRight,
    Database, HardDrive, ArrowUpRight,
} from 'lucide-react';
import './HomePage.css';

// ---- Mock data for the rich dashboard ----

const costBars = [52, 60, 45, 72, 58, 65, 48, 55, 70, 63, 68, 54, 80, 75, 62, 58, 45, 50, 67, 72, 55, 60, 48, 65, 58, 52, 70, 64, 78, 55];
const sparkBars = [40, 55, 38, 62, 50, 45, 70, 58, 42, 65, 75, 55];

const resources = [
    { name: 'checkout-api', provider: 'AWS', region: 'us-east-1', type: 'COMPUTE', cost: '$121.47', health: 'healthy' as const, size: 't3.medium × 4' },
    { name: 'orders-db', provider: 'AWS', region: 'us-east-1', type: 'DATABASE', cost: '$240.18', health: 'healthy' as const, size: 'db.r5.large' },
    { name: 'billing-api', provider: 'AZURE', region: 'eastus', type: 'COMPUTE', cost: '$210.24', health: 'degraded' as const, size: 'D2s_v3 × 3' },
    { name: 'aks-workers', provider: 'AZURE', region: 'westeurope', type: 'CONTAINER', cost: '$709.56', health: 'healthy' as const, size: 'D4s_v3 × 5' },
    { name: 'reports-db', provider: 'AZURE', region: 'eastus', type: 'DATABASE', cost: '$399.50', health: 'unhealthy' as const, size: 'GP_Gen5_4' },
    { name: 'gke-batch', provider: 'GCP', region: 'us-central1', type: 'CONTAINER', cost: '$424.66', health: 'healthy' as const, size: 'n2-std-4 × 3' },
];

const recommendations = [
    { title: 'Right-size RDS instance', desc: 'orders-db · AWS', impact: '-$91.10/mo', type: 'saving' as const, icon: <Database size={14} /> },
    { title: 'Scale down idle instances', desc: 'staging-api · AWS', impact: '-$15.18/mo', type: 'saving' as const, icon: <TrendingDown size={14} /> },
    { title: 'Expand storage capacity', desc: 'orders-db · 84% used', impact: '+$7.19/mo', type: 'perf' as const, icon: <HardDrive size={14} /> },
    { title: 'Scale down search-svc', desc: 'search-svc · GCP', impact: '-$48.91/mo', type: 'saving' as const, icon: <TrendingDown size={14} /> },
];

const activities = [
    { type: 'success' as const, title: 'Scale completed', desc: 'checkout-api → 6 instances', time: '2 min ago' },
    { type: 'purple' as const, title: 'New recommendation', desc: 'Right-size orders-db for $91/mo savings', time: '8 min ago' },
    { type: 'amber' as const, title: 'Cost anomaly detected', desc: 'aks-workers cost +40% vs baseline', time: '23 min ago' },
    { type: 'info' as const, title: 'Approval requested', desc: 'Scale checkout-api to 10 · needs Manager', time: '1 hr ago' },
    { type: 'success' as const, title: 'Budget alert cleared', desc: 'AWS Production back under 80% threshold', time: '3 hr ago' },
];

const alerts = [
    { severity: 'critical' as const, title: 'Database health degraded', meta: 'reports-db · error_rate 6.2%' },
    { severity: 'warning' as const, title: 'High latency detected', meta: 'billing-api · p95 2.2× baseline' },
    { severity: 'info' as const, title: 'Storage utilization high', meta: 'orders-db · 84% of 500GB used' },
];

export function HomePage() {
    return (
        <div className="dashboard">
            {/* ---- Hero ---- */}
            <section className="hero">
                <div className="hero-bg" />
                <div className="hero-content anim-in">
                    <div className="hero-top-row">
                        <div className="hero-brand">
                            <div className="logo-mark">
                                <Cloud />
                            </div>
                            <span className="logo-wordmark">CloudOps</span>
                        </div>
                        <div className="hero-controls">
                            <div className="search-input-wrapper" style={{ width: 260 }}>
                                <Search size={15} />
                                <input
                                    className="input input-sm search-input"
                                    placeholder="Search resources..."
                                    readOnly
                                />
                                <span className="search-shortcut"><Command size={10} /> K</span>
                            </div>
                            <button className="icon-btn"><Bell size={16} /></button>
                            <button className="icon-btn"><Sparkles size={16} /></button>
                        </div>
                    </div>
                    <div className="hero-heading">
                        <h1>
                            Operate every cloud from one{' '}
                            <strong>intelligent control plane</strong>
                        </h1>
                        <div className="hero-tagline">
                            <span><Monitor size={13} /> Monitor</span>
                            <div className="hero-tagline-dot" />
                            <span><BarChart3 size={13} /> Optimize</span>
                            <div className="hero-tagline-dot" />
                            <span><Zap size={13} /> Scale</span>
                            <div className="hero-tagline-dot" />
                            <span style={{ color: 'var(--text-muted)' }}>across AWS, Azure & GCP</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- KPI Strip ---- */}
            <div className="kpi-strip">
                <div className="kpi anim-in anim-d1">
                    <div className="kpi-top">
                        <span className="kpi-title">Total Resources</span>
                        <div className="kpi-icon purple"><Server size={14} /></div>
                    </div>
                    <div className="kpi-number">142</div>
                    <div className="kpi-footer">
                        <span className="kpi-sub">AWS 58 · Azure 46 · GCP 38</span>
                    </div>
                </div>

                <div className="kpi anim-in anim-d2">
                    <div className="kpi-top">
                        <span className="kpi-title">Monthly Cost</span>
                        <div className="kpi-icon green"><DollarSign size={14} /></div>
                    </div>
                    <div className="kpi-number">$12,487</div>
                    <div className="kpi-footer">
                        <span className="kpi-trend up"><TrendingDown size={12} /> 8.2%</span>
                        <span className="kpi-sub">vs last month</span>
                    </div>
                    <div className="kpi-sparkline">
                        {sparkBars.map((h, i) => (
                            <div key={i} className="kpi-sparkline-bar" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                    <div className="kpi-gold-line" />
                </div>

                <div className="kpi anim-in anim-d3">
                    <div className="kpi-top">
                        <span className="kpi-title">Resource Health</span>
                        <div className="kpi-icon green"><Shield size={14} /></div>
                    </div>
                    <div className="kpi-number">96.5<span style={{ fontSize: 16, color: 'var(--text-muted)' }}>%</span></div>
                    <div className="kpi-footer">
                        <span className="kpi-sub" style={{ color: 'var(--success)' }}>137</span>
                        <span className="kpi-sub" style={{ color: 'var(--warning)' }}>4</span>
                        <span className="kpi-sub" style={{ color: 'var(--error)' }}>1</span>
                    </div>
                </div>

                <div className="kpi anim-in anim-d4">
                    <div className="kpi-top">
                        <span className="kpi-title">Active Recommendations</span>
                        <div className="kpi-icon purple"><Sparkles size={14} /></div>
                    </div>
                    <div className="kpi-number">8</div>
                    <div className="kpi-footer">
                        <span className="kpi-sub">5 Cost · 2 Perf · 1 Security</span>
                    </div>
                </div>

                <div className="kpi anim-in anim-d5">
                    <div className="kpi-top">
                        <span className="kpi-title">Pending Approvals</span>
                        <div className="kpi-icon amber"><AlertTriangle size={14} /></div>
                    </div>
                    <div className="kpi-number">2</div>
                    <div className="kpi-footer">
                        <span className="kpi-sub">Requires Manager</span>
                    </div>
                </div>
            </div>

            {/* Heritage decorative line */}
            <div className="heritage-line" />

            {/* ---- Main Grid ---- */}
            <div className="dash-main">
                <div className="dash-left">
                    {/* Cost + Health Row */}
                    <div className="cost-row">
                        {/* Cost Trend */}
                        <div className="s-card anim-in anim-d3">
                            <div className="s-card-header">
                                <div className="s-card-title">
                                    <div className="s-card-title-dot" style={{ background: 'var(--accent)' }} />
                                    Cost Trend
                                </div>
                                <span className="badge badge-neutral" style={{ fontSize: 11 }}>MTD</span>
                            </div>
                            <div className="s-card-body">
                                <div className="cost-header">
                                    <span className="cost-big">$12,487</span>
                                    <span className="cost-change down"><TrendingDown size={12} /> 8.2%</span>
                                </div>
                                <div className="chart-area">
                                    <div className="chart-grid">
                                        <div className="chart-grid-line" />
                                        <div className="chart-grid-line" />
                                        <div className="chart-grid-line" />
                                        <div className="chart-grid-line" />
                                    </div>
                                    {costBars.map((h, i) => (
                                        <div key={i} className="chart-bar actual" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                                <div className="chart-labels">
                                    <span className="chart-label">Sep 1</span>
                                    <span className="chart-label">Sep 10</span>
                                    <span className="chart-label">Sep 19</span>
                                </div>
                                <div className="budget-bar-track">
                                    <div className="budget-bar-fill" style={{ width: '53.7%' }} />
                                </div>
                                <div className="budget-labels">
                                    <span className="budget-label">$12,487 / $3,500 budget</span>
                                    <span className="budget-label">53.7%</span>
                                </div>
                            </div>
                        </div>

                        {/* Resource Health */}
                        <div className="s-card anim-in anim-d4">
                            <div className="s-card-header">
                                <div className="s-card-title">
                                    <div className="s-card-title-dot" style={{ background: 'var(--success)' }} />
                                    Resource Health
                                </div>
                                <span style={{ fontSize: 24, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                                    96.5<span style={{ fontSize: 13, color: 'var(--text-muted)' }}>%</span>
                                </span>
                            </div>
                            <div className="s-card-body">
                                <div className="health-bar-wrapper">
                                    <div className="health-bar">
                                        <div className="health-segment healthy" style={{ flex: 137 }} />
                                        <div className="health-segment warning" style={{ flex: 4 }} />
                                        <div className="health-segment critical" style={{ flex: 1 }} />
                                    </div>
                                </div>
                                <div className="health-legend">
                                    <div className="health-item"><div className="health-dot green" /><span className="health-number">137</span> Healthy</div>
                                    <div className="health-item"><div className="health-dot amber" /><span className="health-number">4</span> Warning</div>
                                    <div className="health-item"><div className="health-dot red" /><span className="health-number">1</span> Critical</div>
                                </div>

                                {/* Cloud Distribution */}
                                <div style={{ marginTop: 16 }}>
                                    <div className="providers-grid">
                                        {[
                                            { name: 'AWS', count: 58, cost: '$2,340', pct: 41, status: true },
                                            { name: 'Azure', count: 46, cost: '$4,890', pct: 32, status: true },
                                            { name: 'GCP', count: 38, cost: '$5,257', pct: 27, status: true },
                                        ].map(p => (
                                            <div key={p.name} className="provider-card">
                                                <div className="provider-card-top">
                                                    <span className="provider-name">{p.name}</span>
                                                    <div className="provider-status" style={{ background: p.status ? 'var(--success)' : 'var(--error)' }} />
                                                </div>
                                                <div className="provider-stats">
                                                    <div className="provider-stat">
                                                        <span className="provider-stat-label">Resources</span>
                                                        <span className="provider-stat-value">{p.count}</span>
                                                    </div>
                                                    <div className="provider-stat">
                                                        <span className="provider-stat-label">Cost MTD</span>
                                                        <span className="provider-stat-value">{p.cost}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Resources */}
                    <div className="s-card anim-in anim-d5">
                        <div className="s-card-header">
                            <div className="s-card-title">
                                <div className="s-card-title-dot" style={{ background: 'var(--info)' }} />
                                Top Resources
                            </div>
                            <button className="btn btn-ghost btn-sm">
                                View All <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="s-card-body" style={{ padding: '8px 18px 12px' }}>
                            {resources.map(r => (
                                <div key={r.name} className="resource-row">
                                    <div className={`resource-provider ${r.provider.toLowerCase()}`}>
                                        {r.provider === 'AWS' ? 'A' : r.provider === 'AZURE' ? 'Az' : 'G'}
                                    </div>
                                    <div className="resource-info">
                                        <div className="resource-name">{r.name}</div>
                                        <div className="resource-meta">{r.provider} · {r.region} · {r.size}</div>
                                    </div>
                                    <div className={`resource-health-badge ${r.health}`}>
                                        {r.health === 'healthy' && <CheckCircle2 size={11} />}
                                        {r.health === 'degraded' && <AlertTriangle size={11} />}
                                        {r.health === 'unhealthy' && <AlertTriangle size={11} />}
                                        {r.health.charAt(0).toUpperCase() + r.health.slice(1)}
                                    </div>
                                    <div className="resource-cost">{r.cost}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="s-card anim-in anim-d7">
                        <div className="s-card-header">
                            <div className="s-card-title">
                                <div className="s-card-title-dot" style={{ background: 'var(--error)' }} />
                                Open Alerts
                            </div>
                            <span className="badge badge-error">3</span>
                        </div>
                        <div className="s-card-body" style={{ padding: '4px 18px 12px' }}>
                            {alerts.map((a, i) => (
                                <div key={i} className="alert-item">
                                    <div className={`alert-severity ${a.severity}`} />
                                    <div className="alert-info">
                                        <div className="alert-title">{a.title}</div>
                                        <div className="alert-meta">{a.meta}</div>
                                    </div>
                                    <button className="btn btn-ghost btn-sm">
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ---- Right Rail ---- */}
                <div className="dash-right">
                    {/* AI Section */}
                    <div className="s-card ai-card anim-in anim-d4">
                        <div className="ai-bg" />
                        <div className="s-card-body">
                            <div className="ai-header">
                                <div className="ai-orb"><Sparkles size={15} /></div>
                                <div>
                                    <div className="ai-label">CloudOps AI</div>
                                    <div className="ai-sub">Your infrastructure, explained</div>
                                </div>
                            </div>
                            <div className="ai-prompts">
                                <div className="ai-prompt">
                                    <ArrowRight size={14} />
                                    Why did our cloud cost increase?
                                </div>
                                <div className="ai-prompt">
                                    <ArrowRight size={14} />
                                    Which resources are underutilized?
                                </div>
                                <div className="ai-prompt">
                                    <ArrowRight size={14} />
                                    What should I optimize next?
                                </div>
                                <div className="ai-prompt">
                                    <ArrowRight size={14} />
                                    Summarize today's changes
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="s-card anim-in anim-d5">
                        <div className="s-card-header">
                            <div className="s-card-title">
                                <div className="s-card-title-dot" style={{ background: 'var(--accent)' }} />
                                Recommendations
                            </div>
                            <span className="badge badge-ai">AI</span>
                        </div>
                        <div className="s-card-body" style={{ padding: '4px 18px 12px' }}>
                            {recommendations.map((r, i) => (
                                <div key={i} className="rec-item">
                                    <div className="rec-icon">{r.icon}</div>
                                    <div className="rec-info">
                                        <div className="rec-title">{r.title}</div>
                                        <div className="rec-desc">{r.desc}</div>
                                        <div className={`rec-impact ${r.type}`}>{r.impact}</div>
                                    </div>
                                    <div className="rec-actions">
                                        <button className="btn btn-primary btn-sm">Review</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="s-card anim-in anim-d6">
                        <div className="s-card-header">
                            <div className="s-card-title">
                                <div className="s-card-title-dot" style={{ background: 'var(--success)' }} />
                                Recent Activity
                            </div>
                        </div>
                        <div className="s-card-body" style={{ padding: '6px 18px 14px' }}>
                            {activities.map((a, i) => (
                                <div key={i} className="activity-item">
                                    <div className="activity-dot-wrap">
                                        <div className={`activity-dot ${a.type}`} />
                                    </div>
                                    <div className="activity-info">
                                        <div className="activity-title">{a.title}</div>
                                        <div className="activity-desc">{a.desc}</div>
                                        <div className="activity-time">{a.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ---- Bottom: Optimization summary ---- */}
            <div className="dash-bottom">
                <div className="s-card anim-in anim-d7">
                    <div className="s-card-header">
                        <div className="s-card-title">
                            <div className="s-card-title-dot" style={{ background: 'var(--optimization)' }} />
                            Optimization Opportunities
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--success)' }}>
                            Est. savings: $465/mo
                        </span>
                    </div>
                    <div className="s-card-body">
                        <div style={{ display: 'flex', gap: 24 }}>
                            <div>
                                <div className="section-label" style={{ marginBottom: 6 }}>Cost Savings</div>
                                <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--success)', letterSpacing: '-0.03em' }}>$465</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>per month potential</div>
                            </div>
                            <div style={{ width: 1, background: 'var(--border)' }} />
                            <div>
                                <div className="section-label" style={{ marginBottom: 6 }}>Performance</div>
                                <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--info)', letterSpacing: '-0.03em' }}>3</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>improvements available</div>
                            </div>
                            <div style={{ width: 1, background: 'var(--border)' }} />
                            <div>
                                <div className="section-label" style={{ marginBottom: 6 }}>Confidence</div>
                                <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--antique-gold)', letterSpacing: '-0.03em' }}>94%</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>avg. AI confidence</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="s-card anim-in anim-d8">
                    <div className="s-card-header">
                        <div className="s-card-title">
                            <div className="s-card-title-dot" style={{ background: 'var(--accent)' }} />
                            System Status
                        </div>
                        <span className="badge badge-healthy">Operational</span>
                    </div>
                    <div className="s-card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                { label: 'Uptime', value: '99.95%', color: 'var(--success)' },
                                { label: 'Avg Latency', value: '312ms', color: 'var(--text-primary)' },
                                { label: 'Traffic', value: '1,840 rps', color: 'var(--text-primary)' },
                                { label: 'Error Rate', value: '0.12%', color: 'var(--success)' },
                                { label: 'Last Sync', value: '2 min ago', color: 'var(--text-muted)' },
                                { label: 'Provider Mode', value: 'Mock', color: 'var(--accent)' },
                            ].map(s => (
                                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: s.color }}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="dash-footer anim-in anim-d8">
                <div className="footer-left">
                    <div className="footer-status">
                        <div className="footer-dot" />
                        All systems operational
                    </div>
                    <div className="footer-divider" />
                    <span className="footer-version">CloudOps v1.0 · Commit 1 · M0</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm">
                        <Sparkles size={13} />
                        Get Started
                    </button>
                    <button className="btn btn-secondary btn-sm">View Docs</button>
                </div>
            </div>
        </div>
    );
}
