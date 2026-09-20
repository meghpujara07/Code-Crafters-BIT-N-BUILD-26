// ============================================================
// CloudOps Mock MSW Handlers (§7)
// ============================================================

import { http, HttpResponse } from 'msw';
import { MOCK_USERS } from './data/users';
import { MOCK_RESOURCES } from './data/resources';
import { generateMetricPoints, generateResourceSeries } from './data/timeseries';
import {
    ApiSuccess,
    ApiFailure,
    LoginResponse,
    SystemHealth,
    DashboardOverview,
    MetricsSummary,
    MetricsTimeseries,
    ResourceMetrics,
    ResourceHealthDetail,
    ResourceCost,
    CostSummary,
    CostTimeseries,
    CostBreakdownItem,
    CostForecast,
    BillingStatement,
    Budget,
    Anomaly,
    Recommendation,
    Alert,
    Resource,
    Policy,
    CloudAccount,
    AuditLog,
    NotificationSetting,
} from '../api/types';

// Mock initial datasets for read endpoints
const MOCK_BUDGETS: Budget[] = [
    {
        id: 'b1111111-1111-4111-a111-111111111111',
        name: 'Production AWS',
        scope: 'PROVIDER',
        scopeValue: 'AWS',
        amountUsd: 1000,
        period: 'MONTHLY',
        alertThresholds: [50, 80, 100],
        hardLimit: false,
        usedUsd: 477.52,
        usedPercent: 47.75,
        forecastUsd: 745.20,
    },
    {
        id: 'b2222222-2222-4222-a222-222222222222',
        name: 'Overall Cloud Spend',
        scope: 'GLOBAL',
        scopeValue: null,
        amountUsd: 3500,
        period: 'MONTHLY',
        alertThresholds: [80, 90, 100],
        hardLimit: true,
        usedUsd: 1879.42,
        usedPercent: 53.7,
        forecastUsd: 2968.10,
    },
];

const MOCK_RECOMMENDATIONS: Recommendation[] = [
    {
        id: '7c1f0a52-3a9b-4c4e-9f10-6d5f0d7f1a11',
        resourceId: 'b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30',
        resourceName: 'checkout-api',
        provider: 'AWS',
        type: 'SCALE_UP',
        status: 'NEW',
        title: 'Scale checkout-api from 4 to 6 instances',
        summary: 'Traffic is up 62% in the last few minutes and CPU is above 80%. High latency risk during peak load.',
        confidence: 91,
        severity: 'WARNING',
        reason: [
            { metric: 'request_rate', observed: 1840.5, threshold: 1701.9, window: '3m' },
            { metric: 'cpu_utilization', observed: 84.2, threshold: 75, window: '3m' },
        ],
        proposedAction: { type: 'SCALE_OUT', params: { targetInstances: 6 } },
        costImpact: {
            currentMonthlyCostUsd: 121.47,
            projectedMonthlyCostUsd: 182.21,
            deltaMonthlyUsd: 60.74,
            deltaPercent: 50.0,
            budget: {
                name: 'Production AWS',
                limitUsd: 1000,
                usedUsd: 477.52,
                afterChangeUsd: 538.26,
                withinBudget: true,
            },
        },
        policyCheck: {
            allowed: true,
            requiresApproval: false,
            approverRole: null,
            checks: [
                { name: 'PERMISSION', passed: true, message: 'You can request scaling actions.' },
                { name: 'POLICY', passed: true, message: '6 instances is within the safety limit (max 10).' },
                { name: 'BUDGET', passed: true, message: 'Stays within the Production AWS budget.' },
                { name: 'APPROVAL', passed: true, message: 'No manager approval needed (increase is under $100/month).' },
            ],
        },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
    {
        id: '8d2f1b63-4b0c-5d5f-a021-7e6f1e8f2b22',
        resourceId: 'w1111111-1111-4111-a111-111111111111',
        resourceName: 'worker-pool',
        provider: 'AWS',
        type: 'RIGHT_SIZE',
        status: 'NEW',
        title: 'Right-size worker-pool from t3.large to t3.medium',
        summary: 'P95 CPU is under 28.5% and memory under 35% for the last 7 days. Downscaling saves $91.10/mo.',
        confidence: 88,
        severity: 'INFO',
        reason: [
            { metric: 'cpu_utilization', observed: 28.5, threshold: 40, window: '7d' },
        ],
        proposedAction: { type: 'RESIZE', params: { targetSize: 't3.medium' } },
        costImpact: {
            currentMonthlyCostUsd: 182.21,
            projectedMonthlyCostUsd: 91.11,
            deltaMonthlyUsd: -91.10,
            deltaPercent: -50.0,
            budget: null,
        },
        policyCheck: {
            allowed: true,
            requiresApproval: false,
            approverRole: null,
            checks: [
                { name: 'PERMISSION', passed: true, message: 'You can request scaling actions.' },
                { name: 'POLICY', passed: true, message: 'Resizing is allowed.' },
                { name: 'BUDGET', passed: true, message: 'Reduces overall monthly expenditure.' },
            ],
        },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
        id: '9e3a2c74-5c1d-6e6a-b132-8f7a2f9a3c33',
        resourceId: 'g1111111-1111-4111-a111-111111111111',
        resourceName: 'analytics-cluster',
        provider: 'GCP',
        type: 'COST_OPTIMIZATION',
        status: 'NEW',
        title: 'Schedule non-prod analytics-cluster night shutdown',
        summary: 'Analytics cluster remains idle between 8 PM and 6 AM daily. Automated night pause cuts GCP compute bill by $210/mo.',
        confidence: 94,
        severity: 'CRITICAL',
        reason: [
            { metric: 'idle_time_pct', observed: 82.0, threshold: 50, window: '14d' },
        ],
        proposedAction: { type: 'STOP', params: { targetInstances: 0 } },
        costImpact: {
            currentMonthlyCostUsd: 420.00,
            projectedMonthlyCostUsd: 210.00,
            deltaMonthlyUsd: -210.00,
            deltaPercent: -50.0,
            budget: null,
        },
        policyCheck: {
            allowed: true,
            requiresApproval: false,
            approverRole: null,
            checks: [
                { name: 'PERMISSION', passed: true, message: 'Authorized for schedule management.' },
                { name: 'POLICY', passed: true, message: 'Non-prod auto-shutdown compliant.' },
            ],
        },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 172800000).toISOString(),
    },
    {
        id: '1f4b3d85-6d2e-7f7b-c243-9a8b3a0b4d44',
        resourceId: 'r2222222-2222-4222-a222-222222222222',
        resourceName: 'backup-vault-v1',
        provider: 'AZURE',
        type: 'RESOURCE_ALLOCATION',
        status: 'ACCEPTED',
        title: 'Transition backup-vault-v1 to Azure Cool Storage Tier',
        summary: 'Blob storage access frequency is < 1 query/month. Moving to Cool tier cuts storage unit cost by 60%.',
        confidence: 96,
        severity: 'INFO',
        reason: [
            { metric: 'access_frequency', observed: 0.2, threshold: 2.0, window: '30d' },
        ],
        proposedAction: { type: 'EXPAND_STORAGE', params: { targetStorageGb: 500 } },
        costImpact: {
            currentMonthlyCostUsd: 75.00,
            projectedMonthlyCostUsd: 30.00,
            deltaMonthlyUsd: -45.00,
            deltaPercent: -60.0,
            budget: null,
        },
        policyCheck: {
            allowed: true,
            requiresApproval: false,
            approverRole: null,
            checks: [
                { name: 'PERMISSION', passed: true, message: 'Storage admin rights granted.' },
                { name: 'POLICY', passed: true, message: 'Tier change policy compliant.' },
            ],
        },
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 10).toISOString(),
    },
];

const MOCK_ALERTS: Alert[] = [
    {
        id: 'a1111111-1111-4111-a111-111111111111',
        severity: 'CRITICAL',
        title: 'High Error Rate on reports-db',
        message: 'reports-db on Azure is experiencing 6.2% error rate.',
        source: 'HEALTH',
        resourceId: 'r2222222-2222-4222-a222-222222222222',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
        id: 'a2222222-2222-4222-a222-222222222222',
        severity: 'WARNING',
        title: 'High Latency on billing-api',
        message: 'billing-api P95 latency is 2.2x baseline.',
        source: 'ANOMALY',
        resourceId: 'b3333333-3333-4333-a333-333333333333',
        status: 'OPEN',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
];

const MOCK_ANOMALIES: Anomaly[] = [
    {
        id: 'an111111-1111-4111-a111-111111111111',
        kind: 'COST',
        severity: 'WARNING',
        resourceId: 'k1111111-1111-4111-a111-111111111111',
        resourceName: 'aks-workers',
        metric: 'daily_cost_usd',
        expectedValue: 18.5,
        observedValue: 46.25,
        status: 'OPEN',
        detectedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
];

const MOCK_POLICIES: Policy[] = [
    {
        id: 'pol-001',
        name: 'Non-Prod Auto-Shutdown & Instance Cap',
        type: 'SAFETY_LIMIT',
        enabled: true,
        priority: 10,
        scope: { provider: 'AWS', resourceType: 'COMPUTE' },
        rules: {
            maxInstances: 10,
            minInstances: 1,
            maxScaleStepPercent: 50,
            maxCostIncreasePerActionUsd: 200,
            blockedActions: ['STOP'],
        },
    },
    {
        id: 'pol-002',
        name: 'High Cost Scale Action Approval Required',
        type: 'APPROVAL_RULE',
        enabled: true,
        priority: 5,
        scope: {},
        rules: {
            requireApprovalWhen: { costDeltaMonthlyUsdGt: 100, actionTypeIn: ['SCALE_OUT'] },
            approverRole: 'MANAGER',
        },
    },
    {
        id: 'pol-003',
        name: 'Database Storage Expansion Guardrail',
        type: 'SAFETY_LIMIT',
        enabled: true,
        priority: 2,
        scope: { resourceType: 'DATABASE' },
        rules: {
            maxInstances: 5,
            minInstances: 1,
        },
    },
];

const MOCK_ACCOUNTS: CloudAccount[] = [
    {
        id: 'acc-aws-prod',
        name: 'Production AWS Primary',
        provider: 'AWS',
        externalAccountId: 'aws-account-882194',
        regions: ['us-east-1', 'us-west-2', 'eu-central-1'],
        mode: 'LIVE',
        status: 'CONNECTED',
        lastSyncedAt: new Date().toISOString(),
        resourceCount: 14,
    },
    {
        id: 'acc-azure-prod',
        name: 'Azure Enterprise Services',
        provider: 'AZURE',
        externalAccountId: 'az-sub-748291',
        regions: ['eastus', 'westeurope'],
        mode: 'LIVE',
        status: 'CONNECTED',
        lastSyncedAt: new Date(Date.now() - 300000).toISOString(),
        resourceCount: 8,
    },
    {
        id: 'acc-gcp-dev',
        name: 'GCP Analytics Sandbox',
        provider: 'GCP',
        externalAccountId: 'gcp-project-918237',
        regions: ['us-central1'],
        mode: 'MOCK',
        status: 'CONNECTED',
        lastSyncedAt: new Date(Date.now() - 900000).toISOString(),
        resourceCount: 5,
    },
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
    {
        id: 'aud-1001',
        actor: { id: 'usr-devops-01', name: 'Alex Chen (DevOps)' },
        action: 'ACTION_REQUESTED',
        entityType: 'RESOURCE',
        entityId: 'b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30',
        before: { targetInstances: 4 },
        after: { targetInstances: 6, costDeltaUsd: 60.74 },
        ts: new Date(Date.now() - 1200000).toISOString(),
    },
    {
        id: 'aud-1002',
        actor: { id: 'usr-manager-01', name: 'Marcus Vance (Manager)' },
        action: 'ACTION_APPROVED',
        entityType: 'ACTION',
        entityId: 'act-sample-pending',
        before: { status: 'PENDING_APPROVAL' },
        after: { status: 'EXECUTING', approvedBy: 'usr-manager-01' },
        ts: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'aud-1003',
        actor: { id: 'usr-admin-01', name: 'Sarah Connor (Admin)' },
        action: 'POLICY_UPDATED',
        entityType: 'POLICY',
        entityId: 'pol-001',
        before: { maxInstances: 8 },
        after: { maxInstances: 10 },
        ts: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'aud-1004',
        actor: { id: 'usr-admin-01', name: 'Sarah Connor (Admin)' },
        action: 'ACCOUNT_CONNECTED',
        entityType: 'CLOUD_ACCOUNT',
        entityId: 'acc-aws-prod',
        before: null,
        after: { provider: 'AWS', accountId: 'aws-account-882194' },
        ts: new Date(Date.now() - 172800000).toISOString(),
    },
];

const MOCK_NOTIFICATION_SETTINGS: NotificationSetting[] = [
    {
        channel: 'IN_APP',
        enabled: true,
        events: ['APPROVAL_REQUESTED', 'ALERT_CREATED'],
        destination: 'Control Plane In-App Banner',
    },
    {
        channel: 'EMAIL',
        enabled: true,
        events: ['BUDGET_THRESHOLD', 'COST_ANOMALY'],
        destination: 'devops-alerts@cloudops.dev',
    },
    {
        channel: 'WHATSAPP',
        enabled: false,
        events: ['APPROVAL_REQUESTED'],
        destination: '+1 (555) 019-2831',
    },
];

export const handlers = [
    // ---- POST /api/v1/auth/login ----
    http.post('/api/v1/auth/login', async ({ request }) => {
        const body = (await request.json()) as { email?: string; password?: string };
        const user = MOCK_USERS.find(u => u.email.toLowerCase() === (body.email || '').toLowerCase());

        if (!user || body.password !== 'Passw0rd!') {
            const errorResponse: ApiFailure = {
                success: false,
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'Invalid email or password. Hint: Use Passw0rd! with any seeded role email.',
                },
            };
            return HttpResponse.json(errorResponse, { status: 401 });
        }

        const data: LoginResponse = {
            accessToken: `mock-access-token-${user.role.toLowerCase()}-${Date.now()}`,
            refreshToken: `mock-refresh-token-${user.role.toLowerCase()}-${Date.now()}`,
            expiresIn: 3600,
            user,
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- POST /api/v1/auth/refresh ----
    http.post('/api/v1/auth/refresh', async ({ request }) => {
        const body = (await request.json()) as { refreshToken?: string };
        if (!body.refreshToken) {
            return HttpResponse.json(
                { success: false, error: { code: 'UNAUTHENTICATED', message: 'Refresh token missing' } },
                { status: 401 }
            );
        }
        const data: LoginResponse = {
            accessToken: `mock-access-token-refreshed-${Date.now()}`,
            refreshToken: `mock-refresh-token-refreshed-${Date.now()}`,
            expiresIn: 3600,
            user: MOCK_USERS[0],
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/system/health ----
    http.get('/api/v1/system/health', () => {
        const data: SystemHealth = {
            status: 'UP',
            db: 'UP',
            version: '1.0.0',
            providerMode: 'MOCK',
            demoControls: true,
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/dashboard/overview ----
    http.get('/api/v1/dashboard/overview', () => {
        const data: DashboardOverview = {
            resources: {
                total: 14,
                byHealth: { HEALTHY: 11, DEGRADED: 2, UNHEALTHY: 1, UNKNOWN: 0 },
                byProvider: { AWS: 6, AZURE: 4, GCP: 4 },
            },
            traffic: { requestRate: 1840.5, changePercent: 62.3 },
            latency: { p95Ms: 312, changePercent: 18.4 },
            uptime: { percent: 99.95 },
            storage: { usedGb: 6860, totalGb: 9800, utilizationPercent: 70.0 },
            cost: {
                monthToDateUsd: 1879.42,
                forecastEndOfMonthUsd: 2968.10,
                budgetUsd: 3500,
                budgetUsedPercent: 53.7,
            },
            counts: { openAlerts: 2, newRecommendations: 2, pendingApprovals: 0 },
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/metrics/summary ----
    http.get('/api/v1/metrics/summary', () => {
        const data: MetricsSummary = {
            traffic: { avg: 1420, peak: 2450, changePercent: 14.2 },
            latency: { p50Ms: 45, p95Ms: 180, p99Ms: 320 },
            uptimePercent: 99.96,
            errorRate: 0.12,
            storage: { usedGb: 6860, totalGb: 9800, utilizationPercent: 70.0 },
            healthCounts: { HEALTHY: 11, DEGRADED: 2, UNHEALTHY: 1, UNKNOWN: 0 },
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/metrics/timeseries ----
    http.get('/api/v1/metrics/timeseries', ({ request }) => {
        const url = new URL(request.url);
        const metric = url.searchParams.get('metric') || 'request_rate';
        const unit = metric === 'request_rate' ? 'req_per_sec' : metric.includes('latency') ? 'ms' : '%';

        const data: MetricsTimeseries = {
            metric,
            unit,
            interval: '5m',
            series: [
                { key: 'AWS', points: generateMetricPoints(800, 20) },
                { key: 'Azure', points: generateMetricPoints(550, 15) },
                { key: 'GCP', points: generateMetricPoints(490, 18) },
            ],
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/resources ----
    http.get('/api/v1/resources', ({ request }) => {
        const url = new URL(request.url);
        const provider = url.searchParams.get('provider');
        const type = url.searchParams.get('type');
        const health = url.searchParams.get('health');
        const search = (url.searchParams.get('search') || '').toLowerCase();
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

        let filtered = [...MOCK_RESOURCES];
        if (provider) filtered = filtered.filter(r => r.provider === provider);
        if (type) filtered = filtered.filter(r => r.type === type);
        if (health) filtered = filtered.filter(r => r.health === health);
        if (search) filtered = filtered.filter(r => r.name.toLowerCase().includes(search) || r.id.includes(search));

        const start = (page - 1) * pageSize;
        const pagedData = filtered.slice(start, start + pageSize);

        return HttpResponse.json({
            success: true,
            data: pagedData,
            meta: {
                page,
                pageSize,
                total: filtered.length,
                totalPages: Math.ceil(filtered.length / pageSize),
            },
        });
    }),

    // ---- GET /api/v1/resources/:id ----
    http.get('/api/v1/resources/:id', ({ params }) => {
        const { id } = params;
        const resource = MOCK_RESOURCES.find(r => r.id === id || r.name === id);
        if (!resource) {
            return HttpResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: `Resource ${id} not found` } },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: resource });
    }),

    // ---- GET /api/v1/resources/:id/metrics ----
    http.get('/api/v1/resources/:id/metrics', ({ params, request }) => {
        const { id } = params as { id: string };
        const url = new URL(request.url);
        const interval = (url.searchParams.get('interval') || '5m') as any;

        const data: ResourceMetrics = {
            resourceId: id,
            interval,
            series: [
                generateResourceSeries(id, 'cpu_utilization', '%', 52, interval),
                generateResourceSeries(id, 'request_rate', 'req/s', 1100, interval),
                generateResourceSeries(id, 'latency_p95_ms', 'ms', 180, interval),
            ],
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/resources/:id/health ----
    http.get('/api/v1/resources/:id/health', ({ params }) => {
        const { id } = params as { id: string };
        const res = MOCK_RESOURCES.find(r => r.id === id);
        const data: ResourceHealthDetail = {
            health: res ? res.health : 'HEALTHY',
            uptimePercent: 99.98,
            lastIncidentAt: res && res.health !== 'HEALTHY' ? new Date(Date.now() - 86400000).toISOString() : null,
            checks: [
                { name: 'Connectivity & Ping', status: 'PASS', message: 'All health probes responding within 15ms' },
                { name: 'CPU & Memory Thresholds', status: res?.health === 'DEGRADED' ? 'WARN' : 'PASS', message: 'Operating within threshold bounds' },
                { name: 'Storage Capacity', status: 'PASS', message: 'Adequate disk space available' },
            ],
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/resources/:id/cost ----
    http.get('/api/v1/resources/:id/cost', ({ params }) => {
        const { id } = params as { id: string };
        const res = MOCK_RESOURCES.find(r => r.id === id);
        const monthly = res ? res.monthlyCostUsd : 121.47;
        const daily = Math.round((monthly / 30) * 100) / 100;

        const dailyCosts = Array.from({ length: 14 }).map((_, i) => {
            const d = new Date(Date.now() - (13 - i) * 86400000);
            return {
                date: d.toISOString().split('T')[0],
                amountUsd: Math.round((daily + (Math.sin(i) * 1.5)) * 100) / 100,
            };
        });

        const data: ResourceCost = {
            monthToDateUsd: Math.round(daily * 19 * 100) / 100,
            forecastUsd: monthly,
            dailyCosts,
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/costs/summary ----
    http.get('/api/v1/costs/summary', () => {
        const data: CostSummary = {
            monthToDateUsd: 1879.42,
            forecastEndOfMonthUsd: 2968.10,
            lastMonthUsd: 2840.00,
            changePercent: 4.5,
            budgetUsd: 3500,
            budgetUsedPercent: 53.7,
            currency: 'USD',
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/costs/timeseries ----
    http.get('/api/v1/costs/timeseries', () => {
        const data: CostTimeseries = {
            interval: '1d',
            series: [
                {
                    key: 'AWS',
                    points: Array.from({ length: 14 }).map((_, i) => ({
                        t: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
                        v: Math.round((25 + Math.sin(i) * 5) * 100) / 100,
                    })),
                },
                {
                    key: 'Azure',
                    points: Array.from({ length: 14 }).map((_, i) => ({
                        t: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
                        v: Math.round((47 + Math.cos(i) * 4) * 100) / 100,
                    })),
                },
                {
                    key: 'GCP',
                    points: Array.from({ length: 14 }).map((_, i) => ({
                        t: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
                        v: Math.round((26 + Math.sin(i * 0.5) * 3) * 100) / 100,
                    })),
                },
            ],
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/costs/breakdown ----
    http.get('/api/v1/costs/breakdown', () => {
        const data: CostBreakdownItem[] = [
            { key: 'Compute', label: 'Virtual Machines & Compute', amountUsd: 940.50, percent: 50.0 },
            { key: 'Database', label: 'Relational & NoSQL DBs', amountUsd: 520.10, percent: 27.7 },
            { key: 'Storage', label: 'Object & Block Storage', amountUsd: 280.40, percent: 14.9 },
            { key: 'Network', label: 'Load Balancers & Egress', amountUsd: 138.42, percent: 7.4 },
        ];
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/costs/forecast ----
    http.get('/api/v1/costs/forecast', () => {
        const points = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date(Date.now() + i * 86400000).toISOString().split('T')[0];
            const base = 98.5 + i * 0.4;
            return {
                date: d,
                amountUsd: Math.round(base * 100) / 100,
                lower: Math.round((base * 0.92) * 100) / 100,
                upper: Math.round((base * 1.08) * 100) / 100,
            };
        });
        const data: CostForecast = {
            points,
            endOfMonthUsd: 2968.10,
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/billing/statements ----
    http.get('/api/v1/billing/statements', () => {
        const data: BillingStatement[] = [
            {
                id: 'stmt-2026-08-aws',
                accountId: 'acc-aws-1',
                provider: 'AWS',
                period: '2026-08',
                totalUsd: 748.20,
                status: 'FINAL',
                lines: [
                    { service: 'Amazon EC2', amountUsd: 480.00 },
                    { service: 'Amazon RDS', amountUsd: 180.00 },
                    { service: 'Amazon S3', amountUsd: 46.00 },
                    { service: 'AWS ALB', amountUsd: 42.20 },
                ],
            },
            {
                id: 'stmt-2026-08-azure',
                accountId: 'acc-azure-1',
                provider: 'AZURE',
                period: '2026-08',
                totalUsd: 1420.50,
                status: 'FINAL',
                lines: [
                    { service: 'Virtual Machines', amountUsd: 690.00 },
                    { service: 'Azure Database for MySQL', amountUsd: 360.00 },
                    { service: 'Blob Storage', amountUsd: 370.50 },
                ],
            },
            {
                id: 'stmt-2026-08-gcp',
                accountId: 'acc-gcp-1',
                provider: 'GCP',
                period: '2026-08',
                totalUsd: 790.30,
                status: 'FINAL',
                lines: [
                    { service: 'Compute Engine', amountUsd: 410.00 },
                    { service: 'Cloud Storage', amountUsd: 40.30 },
                    { service: 'Cloud Memorystore', amountUsd: 340.00 },
                ],
            },
        ];
        return HttpResponse.json({ success: true, data });
    }),

    // ---- GET /api/v1/budgets ----
    http.get('/api/v1/budgets', () => {
        return HttpResponse.json({ success: true, data: MOCK_BUDGETS });
    }),

    // ---- GET /api/v1/recommendations ----
    http.get('/api/v1/recommendations', () => {
        return HttpResponse.json({
            success: true,
            data: MOCK_RECOMMENDATIONS,
            meta: { page: 1, pageSize: 20, total: MOCK_RECOMMENDATIONS.length, totalPages: 1 },
        });
    }),

    // ---- GET /api/v1/recommendations/:id ----
    http.get('/api/v1/recommendations/:id', ({ params }) => {
        const rec = MOCK_RECOMMENDATIONS.find(r => r.id === params.id);
        if (!rec) {
            return HttpResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Recommendation not found' } },
                { status: 404 }
            );
        }
        return HttpResponse.json({ success: true, data: rec });
    }),

    // ---- POST /api/v1/recommendations/:id/accept ----
    http.post('/api/v1/recommendations/:id/accept', ({ params }) => {
        const rec = MOCK_RECOMMENDATIONS.find(r => r.id === params.id);
        if (rec) {
            rec.status = 'ACCEPTED';
        }
        const action = {
            id: `act-${Date.now()}`,
            resourceId: rec?.resourceId || 'b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30',
            resourceName: rec?.resourceName || 'checkout-api',
            recommendationId: rec?.id || null,
            type: rec?.proposedAction.type || 'SCALE_OUT',
            params: rec?.proposedAction.params || { targetInstances: 6 },
            status: 'EXECUTING',
            requestedBy: { id: '3d2f6b1e-7a44-4c0d-9e8b-5a1c2f9d0e33', name: 'Dev Ops' },
            approvedBy: null,
            validation: rec?.policyCheck || {
                allowed: true,
                requiresApproval: false,
                approverRole: null,
                checks: [{ name: 'PERMISSION', passed: true, message: 'Authorized' }],
            },
            costImpact: rec?.costImpact || {
                currentMonthlyCostUsd: 121.47,
                projectedMonthlyCostUsd: 182.21,
                deltaMonthlyUsd: 60.74,
                deltaPercent: 50.0,
                budget: null,
            },
            result: null,
            error: null,
            createdAt: new Date().toISOString(),
            executedAt: null,
        };
        return HttpResponse.json({ success: true, data: action }, { status: 201 });
    }),

    // ---- POST /api/v1/recommendations/:id/dismiss ----
    http.post('/api/v1/recommendations/:id/dismiss', ({ params }) => {
        const rec = MOCK_RECOMMENDATIONS.find(r => r.id === params.id);
        if (rec) {
            rec.status = 'DISMISSED';
        }
        return HttpResponse.json({ success: true, data: rec });
    }),

    // ---- POST /api/v1/ai/explain ----
    http.post('/api/v1/ai/explain', async () => {
        const data = {
            explanation:
                'Traffic on checkout-api increased by 62% in the past 10 minutes following a campaign launch. CPU utilization is currently hovering at 84.2%, exceeding the safety threshold of 75%. Scaling out from 4 to 6 instances will distribute incoming HTTP requests, bringing baseline CPU utilization down to ~55% while maintaining low latency (P95 < 200ms). The monthly cost increase of +$60.74 is well within the Production AWS budget limit.',
            keyPoints: [
                'Traffic spike detected: +62% HTTP request volume',
                'CPU utilization exceeds 80% safety limit',
                'Scaling out to 6 instances targets ~55% CPU utilization',
                'Cost impact (+ $60.74/mo) is within monthly budget envelope',
            ],
            generatedAt: new Date().toISOString(),
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- POST /api/v1/actions/preview ----
    http.post('/api/v1/actions/preview', async ({ request }) => {
        const body = (await request.json()) as any;
        const targetQty = body.params?.targetInstances || 6;
        const isBlocked = targetQty > 10;
        const needsApproval = targetQty > 8;

        const data = {
            costImpact: {
                currentMonthlyCostUsd: 121.47,
                projectedMonthlyCostUsd: 30.37 * targetQty,
                deltaMonthlyUsd: Math.round((30.37 * targetQty - 121.47) * 100) / 100,
                deltaPercent: Math.round(((targetQty - 4) / 4) * 100),
                budget: {
                    name: 'Production AWS',
                    limitUsd: 1000,
                    usedUsd: 477.52,
                    afterChangeUsd: 477.52 + (30.37 * targetQty - 121.47),
                    withinBudget: true,
                },
            },
            validation: {
                allowed: !isBlocked,
                requiresApproval: needsApproval,
                approverRole: needsApproval ? 'MANAGER' : null,
                checks: [
                    { name: 'PERMISSION', passed: true, message: 'You have actions.request permission.' },
                    {
                        name: 'POLICY',
                        passed: !isBlocked,
                        message: isBlocked
                            ? `Scaling to ${targetQty} instances exceeds the safety limit of 10.`
                            : `${targetQty} instances is within the safety limit (max 10).`,
                    },
                    { name: 'BUDGET', passed: true, message: 'Stays within Production AWS budget.' },
                    {
                        name: 'APPROVAL',
                        passed: !needsApproval,
                        message: needsApproval
                            ? `Cost increase of +$${(30.37 * targetQty - 121.47).toFixed(2)}/month requires Manager approval.`
                            : 'No manager approval needed.',
                    },
                ],
            },
        };
        return HttpResponse.json({ success: true, data });
    }),

    // ---- POST /api/v1/actions ----
    http.post('/api/v1/actions', async ({ request }) => {
        const body = (await request.json()) as any;
        const targetQty = body.params?.targetInstances || 6;
        const isBlocked = targetQty > 10;
        const needsApproval = targetQty > 8;

        let status = 'EXECUTING';
        if (isBlocked) status = 'BLOCKED';
        else if (needsApproval) status = 'PENDING_APPROVAL';

        const action = {
            id: `act-${Date.now()}`,
            resourceId: body.resourceId || 'b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30',
            resourceName: 'checkout-api',
            recommendationId: body.recommendationId || null,
            type: body.type || 'SCALE_OUT',
            params: body.params || { targetInstances: targetQty },
            status,
            requestedBy: { id: '3d2f6b1e-7a44-4c0d-9e8b-5a1c2f9d0e33', name: 'Dev Ops' },
            approvedBy: null,
            validation: {
                allowed: !isBlocked,
                requiresApproval: needsApproval,
                approverRole: needsApproval ? ('MANAGER' as const) : null,
                checks: [
                    { name: 'PERMISSION', passed: true, message: 'Authorized' },
                    {
                        name: 'POLICY',
                        passed: !isBlocked,
                        message: isBlocked
                            ? `Scaling to ${targetQty} instances exceeds maximum 10 limit.`
                            : `${targetQty} instances within policy bounds.`,
                    },
                ],
            },
            costImpact: {
                currentMonthlyCostUsd: 121.47,
                projectedMonthlyCostUsd: 30.37 * targetQty,
                deltaMonthlyUsd: Math.round((30.37 * targetQty - 121.47) * 100) / 100,
                deltaPercent: Math.round(((targetQty - 4) / 4) * 100),
                budget: null,
            },
            result: status === 'EXECUTING' ? { message: 'Scaling initiated via AWS Adapter' } : null,
            error: isBlocked ? 'Safety limit policy violation' : null,
            createdAt: new Date().toISOString(),
            executedAt: status === 'EXECUTING' ? new Date().toISOString() : null,
        };

        return HttpResponse.json({ success: true, data: action }, { status: 201 });
    }),

    // ---- GET /api/v1/actions ----
    http.get('/api/v1/actions', () => {
        const mockActions = [
            {
                id: 'act-sample-pending',
                resourceId: 'b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30',
                resourceName: 'checkout-api',
                recommendationId: null,
                type: 'SCALE_OUT',
                params: { targetInstances: 10 },
                status: 'PENDING_APPROVAL',
                requestedBy: { id: '3d2f6b1e-7a44-4c0d-9e8b-5a1c2f9d0e33', name: 'Dev Ops' },
                approvedBy: null,
                validation: {
                    allowed: true,
                    requiresApproval: true,
                    approverRole: 'MANAGER',
                    checks: [
                        { name: 'PERMISSION', passed: true, message: 'Requested by DevOps' },
                        { name: 'POLICY', passed: true, message: '10 instances within limit' },
                        { name: 'APPROVAL', passed: false, message: 'Requires Manager approval' },
                    ],
                },
                costImpact: {
                    currentMonthlyCostUsd: 121.47,
                    projectedMonthlyCostUsd: 303.70,
                    deltaMonthlyUsd: 182.23,
                    deltaPercent: 150.0,
                    budget: null,
                },
                result: null,
                error: null,
                createdAt: new Date(Date.now() - 900000).toISOString(),
                executedAt: null,
            },
        ];
        return HttpResponse.json({
            success: true,
            data: mockActions,
            meta: { page: 1, pageSize: 20, total: mockActions.length, totalPages: 1 },
        });
    }),

    // ---- POST /api/v1/actions/:id/approve ----
    http.post('/api/v1/actions/:id/approve', ({ params }) => {
        return HttpResponse.json({
            success: true,
            data: {
                id: params.id,
                status: 'EXECUTING',
                approvedBy: { id: 'm2222222-2222-4222-a222-222222222222', name: 'Manager User' },
                executedAt: new Date().toISOString(),
            },
        });
    }),

    // ---- POST /api/v1/actions/:id/reject ----
    http.post('/api/v1/actions/:id/reject', ({ params }) => {
        return HttpResponse.json({
            success: true,
            data: {
                id: params.id,
                status: 'REJECTED',
            },
        });
    }),

    // ---- POST /api/v1/actions/:id/cancel ----
    http.post('/api/v1/actions/:id/cancel', ({ params }) => {
        return HttpResponse.json({
            success: true,
            data: {
                id: params.id,
                status: 'CANCELLED',
            },
        });
    }),

    // ---- GET /api/v1/policies ----
    http.get('/api/v1/policies', () => {
        return HttpResponse.json({ success: true, data: MOCK_POLICIES });
    }),

    // ---- PATCH /api/v1/policies/:id ----
    http.patch('/api/v1/policies/:id', async ({ params, request }) => {
        const body = (await request.json()) as any;
        const pol = MOCK_POLICIES.find(p => p.id === params.id);
        if (pol) {
            Object.assign(pol, body);
        }
        return HttpResponse.json({ success: true, data: pol });
    }),

    // ---- GET /api/v1/accounts ----
    http.get('/api/v1/accounts', () => {
        return HttpResponse.json({ success: true, data: MOCK_ACCOUNTS });
    }),

    // ---- POST /api/v1/accounts ----
    http.post('/api/v1/accounts', async ({ request }) => {
        const body = (await request.json()) as any;
        const newAcc: CloudAccount = {
            id: `acc-${body.provider.toLowerCase()}-${Date.now()}`,
            name: body.name || 'New Cloud Account',
            provider: body.provider || 'AWS',
            externalAccountId: body.externalAccountId || 'acc-12345',
            regions: body.regions || ['us-east-1'],
            mode: 'LIVE',
            status: 'CONNECTED',
            lastSyncedAt: new Date().toISOString(),
            resourceCount: 0,
        };
        MOCK_ACCOUNTS.push(newAcc);
        return HttpResponse.json({ success: true, data: newAcc }, { status: 201 });
    }),

    // ---- GET /api/v1/alerts ----
    http.get('/api/v1/alerts', () => {
        return HttpResponse.json({
            success: true,
            data: MOCK_ALERTS,
            meta: { page: 1, pageSize: 20, total: MOCK_ALERTS.length, totalPages: 1 },
        });
    }),

    // ---- POST /api/v1/alerts/:id/acknowledge ----
    http.post('/api/v1/alerts/:id/acknowledge', ({ params }) => {
        const alert = MOCK_ALERTS.find(a => a.id === params.id);
        if (alert) alert.status = 'ACKNOWLEDGED';
        return HttpResponse.json({ success: true, data: alert });
    }),

    // ---- POST /api/v1/alerts/:id/resolve ----
    http.post('/api/v1/alerts/:id/resolve', ({ params }) => {
        const alert = MOCK_ALERTS.find(a => a.id === params.id);
        if (alert) alert.status = 'RESOLVED';
        return HttpResponse.json({ success: true, data: alert });
    }),

    // ---- GET /api/v1/audit/logs ----
    http.get('/api/v1/audit/logs', () => {
        return HttpResponse.json({
            success: true,
            data: MOCK_AUDIT_LOGS,
            meta: { page: 1, pageSize: 20, total: MOCK_AUDIT_LOGS.length, totalPages: 1 },
        });
    }),

    // ---- GET /api/v1/notifications/settings ----
    http.get('/api/v1/notifications/settings', () => {
        return HttpResponse.json({ success: true, data: MOCK_NOTIFICATION_SETTINGS });
    }),

    // ---- PATCH /api/v1/notifications/settings ----
    http.patch('/api/v1/notifications/settings', async ({ request }) => {
        const body = (await request.json()) as any;
        return HttpResponse.json({ success: true, data: body });
    }),

    // ---- GET /api/v1/users ----
    http.get('/api/v1/users', () => {
        return HttpResponse.json({
            success: true,
            data: MOCK_USERS,
            meta: { page: 1, pageSize: 20, total: MOCK_USERS.length, totalPages: 1 },
        });
    }),
];

