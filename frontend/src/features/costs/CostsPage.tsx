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
    Layers,
    Sparkles,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import {
    CostSummary,
    CostTimeseries,
    CostBreakdownItem,
    CostForecast,
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
                    <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Cost Intelligence & Budgets</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Multi-cloud spend tracking, budget caps, and billing statements
                    </p>
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
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Month to Date</span>
                        <DollarSign size={16} style={{ color: 'var(--success)' }} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 600 }}>{formattedMonth}</div>
                    <div style={{ fontSize: 12, color: 'var(--success)' }}>+{summary.changePercent}% vs previous period</div>
                </div>

                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Forecast End of Month</span>
                        <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 600 }}>{formattedForecast}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cap: ${summary.budgetUsd.toLocaleString()}</div>
                </div>

                <div className="s-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Budget Used</span>
                        <PieIcon size={16} style={{ color: 'var(--warning)' }} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 600 }}>{summary.budgetUsedPercent}%</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>On track with spending limits</div>
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
                                    <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.06)' }}>
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

            {/* Billing Statements Section */}
            <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Historical Billing Statements</h3>
                <div className="s-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="s-table">
                        <thead>
                            <tr>
                                <th>Statement ID</th>
                                <th>Provider</th>
                                <th>Period</th>
                                <th>Status</th>
                                <th>Total USD</th>
                                <th style={{ textAlign: 'right' }}>Download</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statements && statements.map(stmt => (
                                <tr key={stmt.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500 }}>{stmt.id}</td>
                                    <td>
                                        <span className="badge badge-neutral">{stmt.provider}</span>
                                    </td>
                                    <td style={{ fontSize: 13 }}>{stmt.period}</td>
                                    <td>
                                        <span className="badge badge-success" style={{ fontSize: 11 }}>{stmt.status}</span>
                                    </td>
                                    <td style={{ fontWeight: 600, fontSize: 14 }}>
                                        ${stmt.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                                            <Download size={14} /> PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
