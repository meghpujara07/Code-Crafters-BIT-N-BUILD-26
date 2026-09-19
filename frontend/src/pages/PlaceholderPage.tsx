// ============================================================
// CloudOps — Reusable Route Placeholder Component
// ============================================================

import { Lock, Construction, Shield } from 'lucide-react';
import { Permission } from '../api/types';

interface PlaceholderPageProps {
    title: string;
    description: string;
    milestone: string;
    permission?: Permission;
}

export function PlaceholderPage({
    title,
    description,
    milestone,
    permission,
}: PlaceholderPageProps) {
    return (
        <div style={{ padding: '40px 32px', maxWidth: 1000 }}>
            <div className="s-card" style={{ padding: 32, textAlign: 'center' }}>
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                    }}
                >
                    <Construction size={24} />
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8 }}>{title}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 480, margin: '0 auto 20px' }}>
                    {description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <span className="badge badge-neutral">Scheduled: {milestone}</span>
                    {permission && (
                        <span className="badge badge-ai" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Shield size={12} /> Required: {permission}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function NotAuthorizedPage({ permission }: { permission?: Permission }) {
    return (
        <div style={{ padding: '40px 32px', maxWidth: 1000 }}>
            <div className="s-card" style={{ padding: 32, textAlign: 'center', borderColor: 'rgba(242, 109, 125, 0.3)' }}>
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'rgba(242, 109, 125, 0.1)',
                        color: 'var(--error)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                    }}
                >
                    <Lock size={24} />
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>Access Restricted</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 480, margin: '0 auto 20px' }}>
                    Your current account role does not have the required permission to access this page.
                </p>

                {permission && (
                    <span className="badge badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={12} /> Missing Permission: {permission}
                    </span>
                )}
            </div>
        </div>
    );
}
