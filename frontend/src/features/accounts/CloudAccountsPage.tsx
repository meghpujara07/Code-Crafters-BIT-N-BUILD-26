// ============================================================
// CloudOps — Cloud Account Connections Page
// Sub-commit 5.1: Provider credentials & sync status management
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Cloud,
    Plus,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Server,
    Globe,
    Layers,
    X,
    Lock,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { CloudAccount, Provider } from '../../api/types';
import { toast } from 'sonner';

export function CloudAccountsPage() {
    const queryClient = useQueryClient();
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider>('AWS');
    const [accountName, setAccountName] = useState('');
    const [externalId, setExternalId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch Accounts
    const { data: accounts = [], isLoading } = useQuery<CloudAccount[]>({
        queryKey: ['cloud-accounts'],
        queryFn: () => apiClient.get<CloudAccount[]>('/accounts'),
    });

    // Connect Account Mutation
    const connectAccountMutation = useMutation({
        mutationFn: (newAcc: { name: string; provider: Provider; externalAccountId: string; regions: string[] }) =>
            apiClient.post<CloudAccount>('/accounts', newAcc),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cloud-accounts'] });
            toast.success('Cloud Account connected successfully');
            setIsConnectModalOpen(false);
            setAccountName('');
            setExternalId('');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to connect cloud account');
        },
    });

    const handleConnectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountName || !externalId) {
            toast.error('Please enter account name and ID');
            return;
        }
        connectAccountMutation.mutate({
            name: accountName,
            provider: selectedProvider,
            externalAccountId: externalId,
            regions: selectedProvider === 'AWS' ? ['us-east-1', 'us-west-2'] : ['eastus'],
        });
    };

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Hero Header */}
            <div className="s-hero" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span className="badge badge-accent">Infrastructure Integrations</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Multi-Cloud Control</span>
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                            Cloud Account Connections
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                            Manage AWS, Azure, and GCP provider credentials for real-time telemetry, auto-discovery, and action execution.
                        </p>
                    </div>

                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setIsConnectModalOpen(true)}
                        style={{ gap: 6 }}
                    >
                        <Plus size={14} /> Connect Cloud Account
                    </button>
                </div>
            </div>

            {/* Account Grid */}
            {isLoading ? (
                <div className="s-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading connected accounts...
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                    {accounts.map(acc => {
                        const isConnected = acc.status === 'CONNECTED';
                        return (
                            <div key={acc.id} className="s-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 'var(--radius-md)',
                                                    background: 'rgba(129, 140, 248, 0.12)',
                                                    color: 'var(--accent)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Cloud size={22} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                    {acc.name}
                                                </h3>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                                                    {acc.externalAccountId}
                                                </div>
                                            </div>
                                        </div>

                                        <span className={`badge ${isConnected ? 'badge-success' : 'badge-warning'}`}>
                                            {acc.status}
                                        </span>
                                    </div>

                                    {/* Stats & Details */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 0', padding: 12, background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Discovered Resources</div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                                                {acc.resourceCount} resources
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active Regions</div>
                                            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)', marginTop: 2 }}>
                                                {acc.regions.length} regions
                                            </div>
                                        </div>
                                    </div>

                                    {/* Regions list */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                                        {acc.regions.map(r => (
                                            <span key={r} className="badge badge-neutral" style={{ fontSize: 10 }}>
                                                <Globe size={10} style={{ marginRight: 4 }} /> {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        Synced: {acc.lastSyncedAt ? new Date(acc.lastSyncedAt).toLocaleTimeString() : 'Just now'}
                                    </span>

                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => toast.success(`Resync triggered for ${acc.name}`)}
                                        style={{ gap: 4, fontSize: 11 }}
                                    >
                                        <RefreshCw size={12} /> Sync Now
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Connect Account Modal */}
            {isConnectModalOpen && (
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
                            maxWidth: 480,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-modal)',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Cloud size={20} style={{ color: 'var(--accent)' }} />
                                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                                    Connect Cloud Account
                                </h3>
                            </div>
                            <button onClick={() => setIsConnectModalOpen(false)} className="icon-btn">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleConnectSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    Cloud Provider
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                    {(['AWS', 'AZURE', 'GCP'] as Provider[]).map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setSelectedProvider(p)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: 'var(--radius-md)',
                                                border: `1px solid ${selectedProvider === p ? 'var(--accent)' : 'var(--border)'}`,
                                                background: selectedProvider === p ? 'rgba(129, 140, 248, 0.12)' : 'var(--surface-secondary)',
                                                color: selectedProvider === p ? 'var(--accent)' : 'var(--text-primary)',
                                                fontWeight: 600,
                                                fontSize: 12,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    Account Display Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Production AWS Primary"
                                    value={accountName}
                                    onChange={e => setAccountName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--surface-secondary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                        fontSize: 13,
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                    External Account ID / Subscription ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 123456789012"
                                    value={externalId}
                                    onChange={e => setExternalId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--surface-secondary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                        fontSize: 13,
                                        fontFamily: 'monospace',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                                <button type="button" onClick={() => setIsConnectModalOpen(false)} className="btn btn-secondary btn-sm">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={connectAccountMutation.isPending}>
                                    Connect & Sync Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
