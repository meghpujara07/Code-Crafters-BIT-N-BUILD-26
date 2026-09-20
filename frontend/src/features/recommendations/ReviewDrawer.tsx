// ============================================================
// CloudOps — Interactive Recommendation Review Drawer
// High-fidelity slide-over drawer styled with CSS Studio Theme
// ============================================================

import { useState } from 'react';
import {
    X,
    Sparkles,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    Cpu,
    Loader2,
} from 'lucide-react';
import { Recommendation, AiExplanation } from '../../api/types';
import { apiClient } from '../../api/client';
import { BudgetBar } from '../../components/ui/BudgetBar';
import { toast } from 'sonner';

interface ReviewDrawerProps {
    recommendation: Recommendation | null;
    onClose: () => void;
    onAccepted?: (recId: string) => void;
    onDismissed?: (recId: string) => void;
}

export function ReviewDrawer({
    recommendation,
    onClose,
    onAccepted,
    onDismissed,
}: ReviewDrawerProps) {
    const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [dismissing, setDismissing] = useState(false);

    if (!recommendation) return null;

    const {
        id,
        title,
        summary,
        severity,
        provider,
        resourceName,
        confidence,
        reason,
        costImpact,
        policyCheck,
    } = recommendation;

    const isCostIncrease = costImpact.deltaMonthlyUsd > 0;
    const isCostDecrease = costImpact.deltaMonthlyUsd < 0;

    const severityBadgeClass =
        severity === 'CRITICAL'
            ? 'badge-error'
            : severity === 'WARNING'
                ? 'badge-warning'
                : 'badge-neutral';

    const handleGenerateAiExplanation = async () => {
        try {
            setLoadingAi(true);
            const res = await apiClient.post<AiExplanation>('/ai/explain', {
                entityType: 'RECOMMENDATION',
                entityId: id,
            });
            setAiExplanation(res);
            toast.success('AI explanation generated');
        } catch (err: any) {
            toast.error(err.message || 'Failed to generate AI explanation');
        } finally {
            setLoadingAi(false);
        }
    };

    const handleAccept = async () => {
        try {
            setAccepting(true);
            const actionRes = await apiClient.post<any>(`/recommendations/${id}/accept`);
            toast.success(`Action initiated for ${resourceName}! Status: ${actionRes.status || 'EXECUTING'}`);
            if (onAccepted) onAccepted(id);
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to accept recommendation');
        } finally {
            setAccepting(false);
        }
    };

    const handleDismiss = async () => {
        try {
            setDismissing(true);
            await apiClient.post(`/recommendations/${id}/dismiss`, { reason: 'User dismissed from review' });
            toast.info(`Recommendation dismissed`);
            if (onDismissed) onDismissed(id);
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to dismiss recommendation');
        } finally {
            setDismissing(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'flex-end',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '580px',
                    height: '100%',
                    background: 'var(--surface)',
                    borderLeft: '1px solid var(--border)',
                    boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'slideInRight 0.25s ease-out',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        background: 'var(--surface-secondary)',
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span className={`badge ${severityBadgeClass}`}>{severity}</span>
                            <span className="badge badge-neutral">{provider}</span>
                            <span className="badge badge-ai" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <TrendingUp size={12} /> {confidence}% confidence
                            </span>
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            {title}
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Target Resource: <strong style={{ color: 'var(--text-secondary)' }}>{resourceName}</strong>
                        </p>
                    </div>
                    <button onClick={onClose} className="icon-btn">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {/* Summary Box */}
                    <div
                        style={{
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--surface-secondary)',
                            border: '1px solid var(--border)',
                            marginBottom: 24,
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                        }}
                    >
                        {summary}
                    </div>

                    {/* Metric Triggers */}
                    <div style={{ marginBottom: 24 }}>
                        <h4
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                marginBottom: 10,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                            }}
                        >
                            Trigger Metrics
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {reason.map((r, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--surface-secondary)',
                                        border: '1px solid var(--border)',
                                    }}
                                >
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Cpu size={13} style={{ color: 'var(--ai-accent)' }} />
                                        {r.metric} ({r.window})
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                                        {r.observed}{' '}
                                        <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                                            (threshold: {r.threshold})
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cost Impact Card */}
                    <div
                        style={{
                            padding: '18px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--surface-secondary)',
                            border: '1px solid var(--border)',
                            marginBottom: 24,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <DollarSign size={16} style={{ color: 'var(--ai-accent)' }} />
                                Cost Impact Analysis
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    color: isCostDecrease ? 'var(--success)' : isCostIncrease ? 'var(--error)' : 'var(--text-muted)',
                                }}
                            >
                                {isCostIncrease ? <ArrowUpRight size={16} /> : isCostDecrease ? <ArrowDownRight size={16} /> : null}
                                {isCostIncrease ? '+' : ''}${Math.abs(costImpact.deltaMonthlyUsd).toFixed(2)} / mo ({costImpact.deltaPercent > 0 ? '+' : ''}{costImpact.deltaPercent.toFixed(1)}%)
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current Monthly Cost</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                                    ${costImpact.currentMonthlyCostUsd.toFixed(2)}
                                </div>
                            </div>
                            <div style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Projected Monthly Cost</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                                    ${costImpact.projectedMonthlyCostUsd.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Budget Bar if budget exists */}
                        {costImpact.budget && (
                            <BudgetBar
                                name={costImpact.budget.name}
                                amountUsd={costImpact.budget.limitUsd}
                                usedUsd={costImpact.budget.usedUsd}
                                forecastUsd={costImpact.budget.afterChangeUsd}
                            />
                        )}
                    </div>

                    {/* Policy & Safety Checks */}
                    <div style={{ marginBottom: 24 }}>
                        <h4
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                marginBottom: 10,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <ShieldCheck size={14} style={{ color: 'var(--ai-accent)' }} />
                            Policy & Validation Checks
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {policyCheck.checks.map((c, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--surface-secondary)',
                                        border: `1px solid ${c.passed ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 77, 106, 0.25)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        fontSize: 13,
                                    }}
                                >
                                    {c.passed ? (
                                        <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                    ) : (
                                        <XCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: 6 }}>{c.name}:</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{c.message}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Explanation Box */}
                    <div style={{ marginBottom: 24 }}>
                        {!aiExplanation ? (
                            <button
                                onClick={handleGenerateAiExplanation}
                                disabled={loadingAi}
                                className="btn btn-secondary"
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    background: 'rgba(167, 139, 250, 0.1)',
                                    borderColor: 'rgba(167, 139, 250, 0.3)',
                                    color: 'var(--ai-accent)',
                                    gap: 8,
                                }}
                            >
                                {loadingAi ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                                Generate AI Explanation
                            </button>
                        ) : (
                            <div
                                style={{
                                    padding: '16px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'rgba(167, 139, 250, 0.08)',
                                    border: '1px solid rgba(167, 139, 250, 0.3)',
                                }}
                            >
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ai-accent)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <Sparkles size={15} />
                                    AI Intelligence Summary
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                                    {aiExplanation.explanation}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {aiExplanation.keyPoints.map((kp, idx) => (
                                        <div key={idx} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                            <span style={{ color: 'var(--ai-accent)', fontWeight: 700 }}>•</span>
                                            {kp}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div
                    style={{
                        padding: '16px 24px',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--surface-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                    }}
                >
                    <button
                        onClick={handleDismiss}
                        disabled={dismissing || accepting}
                        className="btn btn-danger btn-sm"
                    >
                        {dismissing ? <Loader2 size={15} className="spin" /> : 'Dismiss'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={onClose} className="btn btn-secondary btn-sm">
                            Cancel
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={accepting || dismissing || !policyCheck.allowed}
                            className="btn btn-primary btn-sm"
                            style={{ gap: 6 }}
                        >
                            {accepting ? <Loader2 size={15} className="spin" /> : <>Accept & Apply Recommendation <Sparkles size={13} /></>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
