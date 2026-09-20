// ============================================================
// CloudOps — Reusable Budget Bar Component
// ============================================================

import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetBarProps {
    name: string;
    usedUsd: number;
    amountUsd: number;
    forecastUsd?: number;
    scope?: string;
    scopeValue?: string | null;
    hardLimit?: boolean;
}

export function BudgetBar({
    name,
    usedUsd,
    amountUsd,
    forecastUsd,
    scope,
    scopeValue,
    hardLimit = false,
}: BudgetBarProps) {
    const percent = Math.min(100, Math.round((usedUsd / (amountUsd || 1)) * 100));

    let colorClass = 'var(--accent)';
    let StatusIcon = CheckCircle2;
    let statusText = 'Normal';

    if (percent >= 95) {
        colorClass = 'var(--error)';
        StatusIcon = ShieldAlert;
        statusText = 'Critical';
    } else if (percent >= 80) {
        colorClass = 'var(--warning)';
        StatusIcon = AlertTriangle;
        statusText = 'Warning';
    }

    const formattedUsed = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usedUsd);
    const formattedLimit = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountUsd);

    return (
        <div className="s-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{name}</span>
                        {scope && (
                            <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                                {scope}{scopeValue ? `: ${scopeValue}` : ''}
                            </span>
                        )}
                        {hardLimit && (
                            <span className="badge badge-error" style={{ fontSize: 10 }}>
                                Hard Limit
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <StatusIcon size={14} style={{ color: colorClass }} />
                    <span style={{ fontWeight: 600, color: colorClass }}>{percent}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>used</span>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div
                style={{
                    width: '100%',
                    height: 8,
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: 10,
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: colorClass,
                        borderRadius: 4,
                        transition: 'width 0.4s ease',
                    }}
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                <span>Spent: <strong style={{ color: 'var(--text-secondary)' }}>{formattedUsed}</strong> of {formattedLimit}</span>
                {forecastUsd !== undefined && (
                    <span>Forecast: <strong style={{ color: 'var(--text-secondary)' }}>${forecastUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                )}
            </div>
        </div>
    );
}
