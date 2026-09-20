// ============================================================
// CloudOps — Interactive Dry-Run Scale Resource Modal
// Sub-commit 4.3: Real-time dry-run preview & action submission
// ============================================================

import { useState, useEffect } from 'react';
import {
    X,
    Sparkles,
    Sliders,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Server,
} from 'lucide-react';
import { Resource, ValidationResult, MoneyImpact } from '../../api/types';
import { apiClient } from '../../api/client';
import { BudgetBar } from '../../components/ui/BudgetBar';
import { toast } from 'sonner';

interface ScaleResourceModalProps {
    resource: Resource | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface PreviewData {
    costImpact: MoneyImpact;
    validation: ValidationResult;
}

export function ScaleResourceModal({
    resource,
    isOpen,
    onClose,
    onSuccess,
}: ScaleResourceModalProps) {
    const [targetInstances, setTargetInstances] = useState<number>(6);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch dry-run preview whenever targetInstances or resource changes
    useEffect(() => {
        if (!isOpen || !resource) return;

        const fetchPreview = async () => {
            try {
                setLoadingPreview(true);
                const res = await apiClient.post<PreviewData>('/actions/preview', {
                    resourceId: resource.id,
                    type: 'SCALE_OUT',
                    params: { targetInstances },
                });
                setPreview(res);
            } catch (err: any) {
                toast.error(err.message || 'Failed to calculate dry-run preview');
            } finally {
                setLoadingPreview(false);
            }
        };

        const timer = setTimeout(fetchPreview, 300);
        return () => clearTimeout(timer);
    }, [isOpen, resource, targetInstances]);

    if (!isOpen || !resource) return null;

    const handleSubmitAction = async () => {
        try {
            setSubmitting(true);
            const actionRes = await apiClient.post<any>('/actions', {
                resourceId: resource.id,
                type: 'SCALE_OUT',
                params: { targetInstances },
            });

            const status = actionRes.status || 'EXECUTING';
            if (status === 'PENDING_APPROVAL') {
                toast.info(`Action submitted for Manager Approval (Status: PENDING_APPROVAL)`);
            } else if (status === 'BLOCKED') {
                toast.error(`Action blocked by policy safety limit!`);
            } else {
                toast.success(`Scaling action initiated for ${resource.name}!`);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit scaling action');
        } finally {
            setSubmitting(false);
        }
    };

    const isCostIncrease = (preview?.costImpact.deltaMonthlyUsd || 0) > 0;
    const isCostDecrease = (preview?.costImpact.deltaMonthlyUsd || 0) < 0;

    return (
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
                    maxWidth: '560px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-modal)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease-out',
                }}
            >
                {/* Modal Header */}
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--surface-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(56, 189, 248, 0.12)',
                                color: 'var(--accent)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Sliders size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                Scale Resource Capacity
                            </h3>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                {resource.name} ({resource.provider} • {resource.type})
                            </p>
                        </div>
                    </div>

                    <button onClick={onClose} className="icon-btn">
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Target Capacity Slider Control */}
                    <div
                        style={{
                            padding: '18px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--surface-secondary)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                Target Instance Count
                            </span>
                            <span
                                style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: 'var(--accent)',
                                    fontFamily: 'monospace',
                                }}
                            >
                                {targetInstances} instances
                            </span>
                        </div>

                        <input
                            type="range"
                            min={1}
                            max={15}
                            value={targetInstances}
                            onChange={e => setTargetInstances(parseInt(e.target.value, 10))}
                            style={{
                                width: '100%',
                                accentColor: 'var(--accent)',
                                cursor: 'pointer',
                                marginBottom: 10,
                            }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>1 min</span>
                            <span>8 (Manager Approval threshold)</span>
                            <span>10 (Policy safety limit)</span>
                            <span>15 max</span>
                        </div>
                    </div>

                    {/* Real-time Dry-Run Preview Panel */}
                    <div
                        style={{
                            padding: '18px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--surface-secondary)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Sparkles size={15} style={{ color: 'var(--ai-accent)' }} />
                                Real-Time Dry-Run Preview
                            </div>
                            {loadingPreview && <Loader2 size={14} className="spin" style={{ color: 'var(--text-muted)' }} />}
                        </div>

                        {preview ? (
                            <>
                                {/* Cost Impact Strip */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                    <div style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Monthly Cost Delta</div>
                                        <div
                                            style={{
                                                fontSize: 16,
                                                fontWeight: 600,
                                                marginTop: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                color: isCostIncrease ? 'var(--error)' : isCostDecrease ? 'var(--success)' : 'var(--text-primary)',
                                            }}
                                        >
                                            {isCostIncrease ? <ArrowUpRight size={16} /> : isCostDecrease ? <ArrowDownRight size={16} /> : null}
                                            {isCostIncrease ? '+' : ''}${preview.costImpact.deltaMonthlyUsd.toFixed(2)}/mo
                                        </div>
                                    </div>

                                    <div style={{ padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Projected Monthly Spend</div>
                                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                                            ${preview.costImpact.projectedMonthlyCostUsd.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Budget Bar */}
                                {preview.costImpact.budget && (
                                    <div style={{ marginBottom: 16 }}>
                                        <BudgetBar
                                            name={preview.costImpact.budget.name}
                                            amountUsd={preview.costImpact.budget.limitUsd}
                                            usedUsd={preview.costImpact.budget.usedUsd}
                                            forecastUsd={preview.costImpact.budget.afterChangeUsd}
                                        />
                                    </div>
                                )}

                                {/* Validation Checks */}
                                <div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: 'var(--text-muted)',
                                            marginBottom: 8,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        <ShieldCheck size={13} style={{ color: 'var(--ai-accent)' }} />
                                        Automated Policy Validation Checks
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {preview.validation.checks.map((check, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 'var(--radius-md)',
                                                    background: 'var(--surface)',
                                                    border: `1px solid ${check.passed ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 77, 106, 0.2)'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    fontSize: 12,
                                                }}
                                            >
                                                {check.passed ? (
                                                    <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                                ) : (
                                                    <XCircle size={15} style={{ color: 'var(--error)', flexShrink: 0 }} />
                                                )}
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{check.name}:</span>
                                                <span style={{ color: 'var(--text-secondary)' }}>{check.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                Calculating dry-run parameters...
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div
                    style={{
                        padding: '16px 24px',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--surface-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <button onClick={onClose} className="btn btn-secondary btn-sm">
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmitAction}
                        disabled={submitting || (preview ? !preview.validation.allowed : false)}
                        className="btn btn-primary btn-sm"
                        style={{ gap: 6 }}
                    >
                        {submitting ? (
                            <Loader2 size={14} className="spin" />
                        ) : (
                            <>
                                Execute Scaling Action <Sparkles size={13} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
