// ============================================================
// CloudOps — Multi-Cloud Resource Inventory List Page
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Server,
    Search,
    ExternalLink,
    ShieldCheck,
    AlertTriangle,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Filter,
    X,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Resource, Provider, ResourceType, Health } from '../../api/types';

export function ResourcesListPage() {
    const navigate = useNavigate();

    // Filters state
    const [provider, setProvider] = useState<Provider | ''>('');
    const [type, setType] = useState<ResourceType | ''>('');
    const [health, setHealth] = useState<Health | ''>('');
    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const pageSize = 10;

    // Query resources
    const queryParams = new URLSearchParams();
    if (provider) queryParams.set('provider', provider);
    if (type) queryParams.set('type', type);
    if (health) queryParams.set('health', health);
    if (search) queryParams.set('search', search);
    queryParams.set('page', page.toString());
    queryParams.set('pageSize', pageSize.toString());

    const { data: response, isLoading } = useQuery({
        queryKey: ['resources', provider, type, health, search, page],
        queryFn: () =>
            apiClient.get<{ data: Resource[]; meta: { page: number; totalPages: number; total: number } }>(
                `/resources?${queryParams.toString()}`
            ),
    });

    const resources = response?.data || [];
    const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };

    const getHealthBadge = (h: Health) => {
        switch (h) {
            case 'HEALTHY':
                return (
                    <span className="badge badge-success" style={{ gap: 4, padding: '4px 10px' }}>
                        <ShieldCheck size={12} /> Healthy
                    </span>
                );
            case 'DEGRADED':
                return (
                    <span className="badge badge-warning" style={{ gap: 4, padding: '4px 10px' }}>
                        <AlertTriangle size={12} /> Degraded
                    </span>
                );
            case 'UNHEALTHY':
                return (
                    <span className="badge badge-error" style={{ gap: 4, padding: '4px 10px' }}>
                        <ShieldAlert size={12} /> Unhealthy
                    </span>
                );
            default:
                return <span className="badge badge-neutral" style={{ padding: '4px 10px' }}>Unknown</span>;
        }
    };

    const getProviderBadge = (p: Provider) => {
        const bgMap: Record<Provider, string> = {
            AWS: '#ff990022',
            AZURE: '#0089d622',
            GCP: '#4285f422',
        };
        const colorMap: Record<Provider, string> = {
            AWS: '#ff9900',
            AZURE: '#0089d6',
            GCP: '#4285f4',
        };
        return (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 9px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    background: bgMap[p],
                    color: colorMap[p],
                    border: `1px solid ${colorMap[p]}44`,
                }}
            >
                {p}
            </span>
        );
    };

    const hasActiveFilters = Boolean(provider || type || health || search);

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1440, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Infrastructure Resource Catalog</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Real-time unified resource inventory across AWS, Azure, and GCP ({meta.total} active resources)
                    </p>
                </div>
            </div>

            {/* Sleek Filter & Control Panel */}
            <div className="s-card" style={{ padding: 18, marginBottom: 20, background: 'var(--surface-overlay)' }}>
                {/* Active Filter Badges & Reset Bar (Upper row, doesn't affect main search grid) */}
                {hasActiveFilters && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 14,
                            paddingBottom: 12,
                            borderBottom: '1px solid var(--border-subtle)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Active Filters:</span>
                            {provider && (
                                <span className="badge badge-neutral" style={{ gap: 4, padding: '3px 8px', fontSize: 11 }}>
                                    Provider: <strong>{provider}</strong>
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setProvider('')} />
                                </span>
                            )}
                            {type && (
                                <span className="badge badge-neutral" style={{ gap: 4, padding: '3px 8px', fontSize: 11 }}>
                                    Type: <strong>{type}</strong>
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setType('')} />
                                </span>
                            )}
                            {health && (
                                <span className="badge badge-neutral" style={{ gap: 4, padding: '3px 8px', fontSize: 11 }}>
                                    Health: <strong>{health}</strong>
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setHealth('')} />
                                </span>
                            )}
                            {search && (
                                <span className="badge badge-neutral" style={{ gap: 4, padding: '3px 8px', fontSize: 11 }}>
                                    Search: <strong>"{search}"</strong>
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />
                                </span>
                            )}
                        </div>

                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                                setProvider('');
                                setType('');
                                setHealth('');
                                setSearch('');
                                setPage(1);
                            }}
                            style={{ gap: 4, color: 'var(--text-muted)', fontSize: 12, height: 26, padding: '0 8px' }}
                        >
                            <X size={13} /> Clear All Filters
                        </button>
                    </div>
                )}

                {/* Main Controls (Fixed CSS Grid — width of search bar and dropdowns NEVER shift) */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 160px 170px 160px',
                        gap: 12,
                        alignItems: 'center',
                    }}
                >
                    {/* Search Box */}
                    <div className="search-input-wrapper">
                        <Search size={15} className="search-icon" />
                        <input
                            type="text"
                            className="input search-input"
                            placeholder="Search by resource name, ID, or region..."
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    {/* Provider Filter */}
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={provider}
                        onChange={e => {
                            setProvider(e.target.value as any);
                            setPage(1);
                        }}
                    >
                        <option value="">All Providers</option>
                        <option value="AWS">AWS</option>
                        <option value="AZURE">Azure</option>
                        <option value="GCP">GCP</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={type}
                        onChange={e => {
                            setType(e.target.value as any);
                            setPage(1);
                        }}
                    >
                        <option value="">All Resource Types</option>
                        <option value="COMPUTE">Compute</option>
                        <option value="DATABASE">Database</option>
                        <option value="STORAGE">Storage</option>
                        <option value="LOAD_BALANCER">Load Balancer</option>
                        <option value="CONTAINER">Container</option>
                    </select>

                    {/* Health Filter */}
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={health}
                        onChange={e => {
                            setHealth(e.target.value as any);
                            setPage(1);
                        }}
                    >
                        <option value="">All Health Statuses</option>
                        <option value="HEALTHY">Healthy</option>
                        <option value="DEGRADED">Degraded</option>
                        <option value="UNHEALTHY">Unhealthy</option>
                    </select>
                </div>
            </div>

            {/* Resource Table Container */}
            <div className="s-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%', minWidth: 950, borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-tertiary)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '14px 20px', textAlign: 'left', minWidth: 220 }}>Resource Name & ID</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', width: 110 }}>Provider</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', width: 130 }}>Type</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', width: 110 }}>Region</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', width: 110 }}>Status</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', width: 130 }}>Health</th>
                                <th style={{ padding: '14px 20px', textAlign: 'right', width: 140 }}>Monthly Cost</th>
                                <th style={{ padding: '14px 20px', textAlign: 'center', width: 90 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                        Loading resource catalog...
                                    </td>
                                </tr>
                            ) : resources.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                        No infrastructure resources match the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                resources.map(res => (
                                    <tr
                                        key={res.id}
                                        style={{
                                            borderBottom: '1px solid var(--border-subtle)',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s ease',
                                        }}
                                        onClick={() => navigate(`/resources/${res.id}`)}
                                        className="card-hover"
                                    >
                                        {/* Resource Name */}
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 8,
                                                        background: 'rgba(124, 106, 246, 0.12)',
                                                        color: 'var(--accent)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Server size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{res.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{res.id}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Provider */}
                                        <td style={{ padding: '14px 16px' }}>{getProviderBadge(res.provider)}</td>

                                        {/* Type */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <span className="badge badge-neutral" style={{ fontSize: 11, padding: '3px 8px' }}>
                                                {res.type}
                                            </span>
                                        </td>

                                        {/* Region */}
                                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{res.region}</td>

                                        {/* Status */}
                                        <td style={{ padding: '14px 16px' }}>
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    color: res.status === 'RUNNING' ? 'var(--success)' : 'var(--text-muted)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        background: res.status === 'RUNNING' ? 'var(--success)' : 'var(--text-muted)',
                                                    }}
                                                />
                                                {res.status.toLowerCase()}
                                            </span>
                                        </td>

                                        {/* Health */}
                                        <td style={{ padding: '14px 16px' }}>{getHealthBadge(res.health)}</td>

                                        {/* Monthly Cost */}
                                        <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                                            ${res.monthlyCostUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>

                                        {/* Action Button */}
                                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    navigate(`/resources/${res.id}`);
                                                }}
                                                style={{ padding: '4px 10px', height: 28 }}
                                                title="View Resource Telemetry"
                                            >
                                                <ExternalLink size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 24px',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--surface-raised)',
                    }}
                >
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Showing page <strong style={{ color: 'var(--text-secondary)' }}>{meta.page}</strong> of{' '}
                        <strong style={{ color: 'var(--text-secondary)' }}>{meta.totalPages}</strong> ({meta.total} total items)
                    </span>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={meta.page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            <ChevronLeft size={14} /> Previous
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            disabled={meta.page >= meta.totalPages}
                            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
