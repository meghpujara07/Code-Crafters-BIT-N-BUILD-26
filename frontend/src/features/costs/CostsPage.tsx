// ============================================================
// CloudOps — Financial Management & Cost Analytics Page
// ============================================================

import { useQuery } from '@tanstack/react-query';
import {
    DollarSign,
    TrendingUp,
    PieChart as PieIcon,
    Download,
    Calendar,
    FileText,
    CheckCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import {
    CostSummary,
    CostTimeseries,
    CostBreakdownItem,
    Budget,
    BillingStatement,
} from '../../api/types';
import { MetricChart } from '../../components/charts/MetricChart';
import { BudgetBar } from '../../components/ui/BudgetBar';

export function CostsPage() {
    // 1. Cost Summary
    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['costs', 'summary'],
        queryFn: () => apiClient.get<CostSummary>('/costs/summary'),
    });

    // 2. Cost Timeseries
    const { data: timeseries } = useQuery({
        queryKey: ['costs', 'timeseries'],
        queryFn: () => apiClient.get<CostTimeseries>('/costs/timeseries'),
    });

    // 3. Service Breakdown
    const { data: breakdown } = useQuery({
        queryKey: ['costs', 'breakdown'],
        queryFn: () => apiClient.get<CostBreakdownItem[]>('/costs/breakdown'),
    });

    // 4. Budgets
    const { data: budgets } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => apiClient.get<Budget[]>('/budgets'),
    });

    // 5. Billing Statements
    const { data: statements } = useQuery({
        queryKey: ['billing', 'statements'],
        queryFn: () => apiClient.get<BillingStatement[]>('/billing/statements'),
    });

    if (summaryLoading || !summary) {
        return (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading cost analytics...
            </div>
        );
    }

    const formattedMonth = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.monthToDateUsd);
    const formattedForecast = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(summary.forecastEndOfMonthUsd);

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
                        Financial Management & Cost Analytics
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Multi-cloud spend tracking, budget caps, and billing statements across AWS, Azure & GCP
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                        <Download size={14} /> Export CSV
                    </button>
                    <button className="btn btn-primary btn-sm" style={{ gap: 6 }}>
                        <DollarSign size={14} /> Create Budget
                    </button>
                </div>
            </div>

            {/* KPI Cards Strip */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month to Date</span>
                        <DollarSign size={16} style={{ color: 'var(--success)' }} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{formattedMonth}</div>
                    <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>+{summary.changePercent}% vs previous period</div>
                </div>

                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forecast End of Month</span>
                        <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{formattedForecast}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Cap: ${summary.budgetUsd.toLocaleString()}</div>
                </div>

                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Budget Used</span>
                        <PieIcon size={16} style={{ color: 'var(--warning)' }} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{summary.budgetUsedPercent}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>On track with spending limits</div>
                </div>
            </div>

            {/* Grid: Spend Timeseries & Service Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, marginBottom: 24 }}>
                {/* Daily Spend Trend */}
                <div className="s-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Daily Cloud Spend Trend</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Spend distribution across AWS, Azure, and GCP over time</p>

                    <MetricChart
                        series={timeseries?.series || []}
                        height={260}
                        unit="$"
                        showLegend={true}
                    />
                </div>

                {/* Service Breakdown */}
                <div className="s-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Service Breakdown</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Expenditure by service tier</p>

                    {breakdown ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {breakdown.map(item => (
                                <div key={item.key}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                        <span style={{ fontWeight: 500 }}>{item.label}</span>
                                        <span>
                                            <strong style={{ color: 'var(--text-primary)' }}>${item.amountUsd.toFixed(2)}</strong> ({item.percent}%)
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--surface-tertiary)' }}>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${item.percent}%`,
                                                borderRadius: 3,
                                                background: item.key === 'Compute' ? 'var(--accent)' : item.key === 'Database' ? 'var(--success)' : item.key === 'Storage' ? 'var(--warning)' : 'var(--ai-accent)',
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)' }}>Loading breakdown...</div>
                    )}
                </div>
            </div>

            {/* Budgets Section */}
            <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Cloud Spending Budgets</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                    {budgets && budgets.map(b => (
                        <BudgetBar
                            key={b.id}
                            name={b.name}
                            usedUsd={b.usedUsd}
                            amountUsd={b.amountUsd}
                            forecastUsd={b.forecastUsd}
                            scope={b.scope}
                            scopeValue={b.scopeValue}
                            hardLimit={b.hardLimit}
                        />
                    ))}
                </div>
            </div>

            {/* Redesigned Billing Statements Section */}
            <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>Historical Billing Statements</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Archived financial statements and monthly multi-cloud invoices</p>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ gap: 6, fontSize: 12 }}>
                        <Download size={13} style={{ color: 'var(--accent)' }} /> Download All Invoices
                    </button>
                </div>

                <div className="s-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                    <table className="table" style={{ width: '100%', tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '28%', paddingLeft: 24, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statement ID</th>
                                <th style={{ width: '16%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cloud Provider</th>
                                <th style={{ width: '16%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing Period</th>
                                <th style={{ width: '14%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ width: '14%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</th>
                                <th style={{ width: '12%', textAlign: 'right', paddingRight: 24, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statements && statements.map(stmt => {
                                const providerLower = stmt.provider.toLowerCase();
                                const badgeStyle = providerLower.includes('aws')
                                    ? { background: 'rgba(255, 153, 0, 0.12)', color: '#FF9900', border: '1px solid rgba(255, 153, 0, 0.3)' }
                                    : providerLower.includes('azure')
                                        ? { background: 'rgba(0, 137, 214, 0.12)', color: '#0089D6', border: '1px solid rgba(0, 137, 214, 0.3)' }
                                        : { background: 'rgba(66, 133, 244, 0.12)', color: '#4285F4', border: '1px solid rgba(66, 133, 244, 0.3)' };

                                return (
                                    <tr key={stmt.id}>
                                        <td style={{ paddingLeft: 24, paddingTop: 16, paddingBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 10,
                                                        background: 'var(--accent-soft)',
                                                        border: '1px solid var(--accent-border)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--accent)',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                            color: 'var(--text-primary)',
                                                            fontFamily: 'var(--font-family)',
                                                            letterSpacing: '-0.01em'
                                                        }}
                                                    >
                                                        {stmt.id}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Verified PDF Statement</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge" style={{ ...badgeStyle, fontWeight: 700, fontSize: 11, padding: '4px 10px', borderRadius: 6, display: 'inline-flex' }}>
                                                {stmt.provider.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                                                <span>{stmt.period}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-success" style={{ fontSize: 11, padding: '4px 10px', gap: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                                                <CheckCircle size={12} />
                                                Finalized
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                                                ${stmt.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                            <button className="btn btn-secondary btn-sm" style={{ gap: 6, padding: '6px 14px', fontWeight: 600, fontSize: 12 }}>
                                                <Download size={13} style={{ color: 'var(--accent)' }} /> PDF Invoice
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
