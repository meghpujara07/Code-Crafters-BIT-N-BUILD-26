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
        summary: 'Traffic is up 62% in the last few minutes and CPU is above 80%.',
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
        summary: 'P95 CPU is under 30% and memory under 35% for the last 7 days.',
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
            ],
        },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
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

    // ---- GET /api/v1/alerts ----
    http.get('/api/v1/alerts', () => {
        return HttpResponse.json({
            success: true,
            data: MOCK_ALERTS,
            meta: { page: 1, pageSize: 20, total: MOCK_ALERTS.length, totalPages: 1 },
        });
    }),

    // ---- GET /api/v1/anomalies ----
    http.get('/api/v1/anomalies', () => {
        return HttpResponse.json({
            success: true,
            data: MOCK_ANOMALIES,
            meta: { page: 1, pageSize: 20, total: MOCK_ANOMALIES.length, totalPages: 1 },
        });
    }),
];
