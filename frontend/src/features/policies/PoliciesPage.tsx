// ============================================================
// CloudOps — Guardrail Policies & Budgets Page
// Sub-commit 5.1: Safety limits, approval rules & budget controls
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Shield,
    DollarSign,
    Sliders,
    Plus,
    CheckCircle2,
    Lock,
    ToggleLeft,
    ToggleRight,
    Search,
    ShieldAlert,
    Clock,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Policy, Budget } from '../../api/types';
import { BudgetBar } from '../../components/ui/BudgetBar';
import { toast } from 'sonner';

export function PoliciesPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'SAFETY_LIMIT' | 'APPROVAL_RULE'>('ALL');

    // Fetch Policies
    const { data: policies = [], isLoading: policiesLoading } = useQuery<Policy[]>({
        queryKey: ['policies'],
        queryFn: () => apiClient.get<Policy[]>('/policies'),
    });

    // Fetch Budgets
    const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({
        queryKey: ['budgets'],
        queryFn: () => apiClient.get<Budget[]>('/budgets'),
    });

    // Toggle Policy Status Mutation
    const togglePolicyMutation = useMutation({
        mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
            apiClient.patch(`/policies/${id}`, { enabled }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
            toast.success('Policy status updated');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update policy');
        },
    });

    const filteredPolicies = policies.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const safetyLimitCount = policies.filter(p => p.type === 'SAFETY_LIMIT').length;
    const approvalRuleCount = policies.filter(p => p.type === 'APPROVAL_RULE').length;

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Hero Header */}
            <div className="s-hero" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span className="badge badge-accent">Control Plane</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Governance & Compliance</span>
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                            Guardrail Policies & Budget Thresholds
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                            Enforce automated safety limits, auto-scaling constraints, and hard budget limits across cloud environments.
                        </p>
                    </div>

                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => toast.info('Create Guardrail Policy drawer opens in production mode.')}
                        style={{ gap: 6 }}
                    >
                        <Plus size={14} /> Create New Guardrail
                    </button>
                </div>
            </div>

            {/* KPI Summary Strip */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <div className="s-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Safety Limit Policies</span>
                        <Shield size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{safetyLimitCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>Auto-enforced in real time</div>
                </div>

                <div className="s-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Approval Gate Rules</span>
                        <Lock size={16} style={{ color: 'var(--warning)' }} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{approvalRuleCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Triggers manager review</div>
                </div>

                <div className="s-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monitored Budgets</span>
                        <DollarSign size={16} style={{ color: 'var(--ai-accent)' }} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{budgets.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Active threshold alerts</div>
                </div>
            </div>

            {/* Section 1: Active Budget Thresholds */}
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
                    Active Financial Budgets
                </h2>
                {budgetsLoading ? (
                    <div className="s-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading budgets...
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                        {budgets.map(budget => (
                            <BudgetBar
                                key={budget.id}
                                name={budget.name}
                                amountUsd={budget.amountUsd}
                                usedUsd={budget.usedUsd}
                                forecastUsd={budget.forecastUsd}
                                scope={budget.scope}
                                scopeValue={budget.scopeValue}
                                hardLimit={budget.hardLimit}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Section 2: Guardrail Policies Management */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        Active Guardrail Policies
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Search Bar */}
                        <div style={{ position: 'relative', width: 220 }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Filter policies..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '6px 12px 6px 30px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--surface-secondary)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    fontSize: 12,
                                }}
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div style={{ display: 'flex', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border)' }}>
                            {(['ALL', 'SAFETY_LIMIT', 'APPROVAL_RULE'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setTypeFilter(tab)}
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: 11,
                                        fontWeight: 500,
                                        borderRadius: 'var(--radius-sm)',
                                        border: 'none',
                                        background: typeFilter === tab ? 'var(--surface)' : 'transparent',
                                        color: typeFilter === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {tab === 'ALL' ? 'All Policies' : tab === 'SAFETY_LIMIT' ? 'Safety Limits' : 'Approval Rules'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {policiesLoading ? (
                    <div className="s-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading policies...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filteredPolicies.map(policy => {
                            const isSafety = policy.type === 'SAFETY_LIMIT';
                            return (
                                <div
                                    key={policy.id}
                                    className="s-card"
                                    style={{
                                        padding: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        opacity: policy.enabled ? 1 : 0.6,
                                        transition: 'opacity 0.2s ease',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 'var(--radius-md)',
                                                background: isSafety ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 176, 32, 0.12)',
                                                color: isSafety ? 'var(--accent)' : 'var(--warning)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                marginTop: 2,
                                            }}
                                        >
                                            {isSafety ? <Shield size={20} /> : <Lock size={20} />}
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {policy.name}
                                                </span>
                                                <span className={`badge ${isSafety ? 'badge-accent' : 'badge-warning'}`}>
                                                    {policy.type}
                                                </span>
                                                {policy.scope.provider && (
                                                    <span className="badge badge-neutral">{policy.scope.provider}</span>
                                                )}
                                                {policy.scope.resourceType && (
                                                    <span className="badge badge-neutral">{policy.scope.resourceType}</span>
                                                )}
                                            </div>

                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {isSafety ? (
                                                    <>
                                                        Max Instances:{' '}
                                                        <strong style={{ color: 'var(--text-secondary)' }}>
                                                            {(policy.rules as any).maxInstances || 'N/A'}
                                                        </strong>{' '}
                                                        • Max Step:{' '}
                                                        <strong style={{ color: 'var(--text-secondary)' }}>
                                                            {(policy.rules as any).maxScaleStepPercent || 'N/A'}%
                                                        </strong>{' '}
                                                        • Blocked Actions:{' '}
                                                        <span className="badge badge-error" style={{ fontSize: 10 }}>
                                                            {(policy.rules as any).blockedActions?.join(', ') || 'None'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        Requires Approval when Monthly Delta &gt;{' '}
                                                        <strong style={{ color: 'var(--text-secondary)' }}>
                                                            ${(policy.rules as any).requireApprovalWhen?.costDeltaMonthlyUsdGt || 0}
                                                        </strong>{' '}
                                                        • Approver Role:{' '}
                                                        <span className="badge badge-warning" style={{ fontSize: 10 }}>
                                                            {(policy.rules as any).approverRole}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <button
                                            onClick={() =>
                                                togglePolicyMutation.mutate({
                                                    id: policy.id,
                                                    enabled: !policy.enabled,
                                                })
                                            }
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                color: policy.enabled ? 'var(--accent)' : 'var(--text-muted)',
                                                fontSize: 13,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {policy.enabled ? (
                                                <>
                                                    <ToggleRight size={28} /> Active
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeft size={28} /> Disabled
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
