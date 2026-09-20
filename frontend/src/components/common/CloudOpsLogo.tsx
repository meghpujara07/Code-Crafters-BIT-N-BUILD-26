import React from 'react';

interface CloudOpsLogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function CloudOpsLogo({ size = 'md', className = '' }: CloudOpsLogoProps) {
    const dim = size === 'sm' ? 26 : size === 'lg' ? 42 : 32;

    return (
        <svg
            width={dim}
            height={dim}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ filter: 'drop-shadow(0 4px 12px rgba(20, 184, 166, 0.35))' }}
        >
            <defs>
                {/* Primary Electric Gradient */}
                <linearGradient id="cloudOpsTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2DD4BF" />
                    <stop offset="50%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>

                {/* Accent Metallic Glow Gradient */}
                <linearGradient id="cloudOpsGlowGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0D9488" />
                </linearGradient>

                {/* Ambient Soft Glow Filter */}
                <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Glassmorphic Background Shield Container */}
            <rect
                x="2"
                y="2"
                width="36"
                height="36"
                rx="10"
                fill="url(#cloudOpsTealGrad)"
                fillOpacity="0.12"
                stroke="url(#cloudOpsTealGrad)"
                strokeWidth="1.5"
                strokeOpacity="0.4"
            />

            {/* Isometric Interlocking Cloud Control Nexus Monogram */}
            {/* Top Cloud Node Shield */}
            <path
                d="M20 7L31 13.35V26.65L20 33L9 26.65V13.35L20 7Z"
                stroke="url(#cloudOpsTealGrad)"
                strokeWidth="2"
                strokeLinejoin="round"
            />

            {/* Inner Connected Control Core */}
            <path
                d="M20 12L27 16V24L20 28L13 24V16L20 12Z"
                fill="url(#cloudOpsTealGrad)"
                fillOpacity="0.25"
                stroke="url(#cloudOpsGlowGrad)"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />

            {/* Center Core Quantum Starburst */}
            <circle cx="20" cy="20" r="3" fill="#FFFFFF" filter="url(#logoGlow)" />
            <circle cx="20" cy="20" r="1.5" fill="#14B8A6" />

            {/* Orbit Node Connections */}
            <circle cx="20" cy="7" r="1.8" fill="#2DD4BF" />
            <circle cx="31" cy="26.65" r="1.8" fill="#38BDF8" />
            <circle cx="9" cy="26.65" r="1.8" fill="#14B8A6" />
        </svg>
    );
}
