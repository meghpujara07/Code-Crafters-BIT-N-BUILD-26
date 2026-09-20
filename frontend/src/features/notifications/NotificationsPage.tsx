// ============================================================
// CloudOps — Notification Channels & Alert Routing Page
// Sub-commit 5.2: Alert routing & multi-channel settings
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Bell,
    Mail,
    MessageSquare,
    Radio,
    ToggleLeft,
    ToggleRight,
    Save,
    CheckCircle2,
    ShieldAlert,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { NotificationSetting, Channel, NotificationEvent } from '../../api/types';
import { toast } from 'sonner';

const ALL_EVENTS: { id: NotificationEvent; label: string }[] = [
    { id: 'ALERT_CREATED', label: 'Incident & Alert Created' },
    { id: 'APPROVAL_REQUESTED', label: 'Action Approval Required' },
    { id: 'BUDGET_THRESHOLD', label: 'Budget Limit Threshold Warning' },
    { id: 'COST_ANOMALY', label: 'Financial Cost Anomaly Spike' },
    { id: 'RECOMMENDATION_CREATED', label: 'AI Optimization Recommendation' },
    { id: 'ACTION_COMPLETED', label: 'Scale Action Execution Complete' },
];

export function NotificationsPage() {
    const queryClient = useQueryClient();

    // Fetch Notification Settings
    const { data: settings = [], isLoading } = useQuery<NotificationSetting[]>({
        queryKey: ['notification-settings'],
        queryFn: () => apiClient.get<NotificationSetting[]>('/notification-settings'),
    });

    const [localSettings, setLocalSettings] = useState<NotificationSetting[]>([]);

    // Initialize local state when settings data loads
    const currentSettings = localSettings.length > 0 ? localSettings : settings;

    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: (updated: NotificationSetting[]) => apiClient.put('/notification-settings', updated),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
            toast.success('Notification routing settings saved');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to save settings');
        },
    });

    const handleToggleChannel = (channel: Channel) => {
        const next = (currentSettings.length > 0 ? currentSettings : settings).map(s =>
            s.channel === channel ? { ...s, enabled: !s.enabled } : s
        );
        setLocalSettings(next);
    };

    const handleDestinationChange = (channel: Channel, destination: string) => {
        const next = (currentSettings.length > 0 ? currentSettings : settings).map(s =>
            s.channel === channel ? { ...s, destination } : s
        );
        setLocalSettings(next);
    };

    const handleEventToggle = (channel: Channel, event: NotificationEvent) => {
        const next = (currentSettings.length > 0 ? currentSettings : settings).map(s => {
            if (s.channel !== channel) return s;
            const exists = s.events.includes(event);
            const events = exists ? s.events.filter(e => e !== event) : [...s.events, event];
            return { ...s, events };
        });
        setLocalSettings(next);
    };

    return (
        <div style={{ padding: '24px 32px 48px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Hero Header */}
            <div className="s-hero" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span className="badge badge-accent">Platform Integration</span>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Alert Dispatching</span>
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                            Notification Channels & Alert Routing
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>
                            Configure alert destinations and trigger rules for automated operational dispatches.
                        </p>
                    </div>

                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => saveMutation.mutate(currentSettings)}
                        disabled={saveMutation.isPending}
                        style={{ gap: 6 }}
                    >
                        <Save size={14} /> Save Channel Routing Rules
                    </button>
                </div>
            </div>

            {/* Notification Channels List */}
            {isLoading ? (
                <div className="s-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading notification channels...
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
                    {currentSettings.map(setting => {
                        const isApp = setting.channel === 'IN_APP';
                        const isEmail = setting.channel === 'EMAIL';
                        const isWhatsApp = setting.channel === 'WHATSAPP';

                        return (
                            <div
                                key={setting.channel}
                                className="s-card"
                                style={{
                                    padding: 24,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    opacity: setting.enabled ? 1 : 0.6,
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 'var(--radius-md)',
                                                    background: 'rgba(56, 189, 248, 0.12)',
                                                    color: 'var(--accent)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {isApp ? <Bell size={20} /> : isEmail ? <Mail size={20} /> : <MessageSquare size={20} />}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                    {setting.channel} Channel
                                                </h3>
                                                <span className={`badge ${setting.enabled ? 'badge-success' : 'badge-neutral'}`} style={{ marginTop: 2 }}>
                                                    {setting.enabled ? 'ACTIVE' : 'DISABLED'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggleChannel(setting.channel)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: setting.enabled ? 'var(--accent)' : 'var(--text-muted)' }}
                                        >
                                            {setting.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                        </button>
                                    </div>

                                    {/* Destination Input */}
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                                            Target Destination Endpoint
                                        </label>
                                        <input
                                            type="text"
                                            value={setting.destination || ''}
                                            onChange={e => handleDestinationChange(setting.channel, e.target.value)}
                                            placeholder="Enter webhook URI, email address or phone..."
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'var(--surface-secondary)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-primary)',
                                                fontSize: 12,
                                                fontFamily: isApp ? 'inherit' : 'monospace',
                                            }}
                                        />
                                    </div>

                                    {/* Events Checkboxes */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                                            Triggering Event Subscriptions
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {ALL_EVENTS.map(evt => {
                                                const checked = setting.events.includes(evt.id);
                                                return (
                                                    <label
                                                        key={evt.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            fontSize: 12,
                                                            color: checked ? 'var(--text-primary)' : 'var(--text-muted)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => handleEventToggle(setting.channel, evt.id)}
                                                            style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                                                        />
                                                        <span>{evt.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
