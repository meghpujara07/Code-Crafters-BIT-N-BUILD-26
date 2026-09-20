// ============================================================
// CloudOps — Login Page Component
// ============================================================

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import { CloudOpsLogo } from '../../components/common/CloudOpsLogo';
import { useLogin } from './useLogin';
import { Role } from '../../api/types';
import './LoginPage.css';

const PRESET_USERS: { role: Role; label: string; email: string }[] = [
    { role: 'ADMIN', label: 'Admin', email: 'admin@cloudops.dev' },
    { role: 'MANAGER', label: 'Manager', email: 'manager@cloudops.dev' },
    { role: 'DEVOPS', label: 'DevOps', email: 'devops@cloudops.dev' },
    { role: 'VIEWER', label: 'Viewer', email: 'viewer@cloudops.dev' },
];

export function LoginPage() {
    const [email, setEmail] = useState('admin@cloudops.dev');
    const [password, setPassword] = useState('Passw0rd!');
    const { login, isLoading, error } = useLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, password);
    };

    const handleSelectPreset = (presetEmail: string) => {
        setEmail(presetEmail);
        setPassword('Passw0rd!');
        login(presetEmail, 'Passw0rd!');
    };

    return (
        <div className="login-container">
            <div className="login-bg" />
            <div className="login-card">
                <div className="login-header">
                    <div style={{ display: 'inline-flex', marginBottom: 12 }}>
                        <CloudOpsLogo size="lg" />
                    </div>
                    <h1 className="login-title">CloudOps Control Plane</h1>
                    <p className="login-subtitle">Sign in to manage multi-cloud infrastructure</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="search-input-wrapper">
                            <Mail style={{ left: 12, position: 'absolute', color: 'var(--text-muted)' }} size={16} />
                            <input
                                type="email"
                                className="input"
                                style={{ paddingLeft: 38 }}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="user@cloudops.dev"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="search-input-wrapper">
                            <Lock style={{ left: 12, position: 'absolute', color: 'var(--text-muted)' }} size={16} />
                            <input
                                type="password"
                                className="input"
                                style={{ paddingLeft: 38 }}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', marginTop: 8 }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            'Authenticating...'
                        ) : (
                            <>
                                Sign In <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="presets-section">
                    <div className="presets-label">Quick Sign-In with Demo Roles</div>
                    <div className="presets-grid">
                        {PRESET_USERS.map(p => (
                            <button
                                key={p.role}
                                type="button"
                                className="preset-btn"
                                onClick={() => handleSelectPreset(p.email)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Shield size={12} style={{ color: 'var(--accent)' }} />
                                    <span className="preset-role">{p.label}</span>
                                </div>
                                <span className="preset-email">{p.email}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
