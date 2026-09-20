// ============================================================
// CloudOps Contract Types — ARCHITECTURE.md §6.1–§6.5 (verbatim)
// This file is the SINGLE source of truth for all API types.
// Do NOT paraphrase, rename, or reorder anything.
// ============================================================

// ---- §6.1 Enums & Envelope ----

export type Role = 'ADMIN' | 'MANAGER' | 'DEVOPS' | 'VIEWER';
export type Provider = 'AWS' | 'AZURE' | 'GCP';
export type ResourceType = 'COMPUTE' | 'DATABASE' | 'STORAGE' | 'LOAD_BALANCER' | 'CONTAINER';
export type ResourceStatus = 'RUNNING' | 'STOPPED' | 'PROVISIONING' | 'ERROR';
export type Health = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

export type RecommendationType =
    | 'SCALE_UP' | 'SCALE_DOWN' | 'RIGHT_SIZE' | 'COST_OPTIMIZATION' | 'RESOURCE_ALLOCATION';
export type RecommendationStatus = 'NEW' | 'ACCEPTED' | 'DISMISSED' | 'EXPIRED';

export type ActionType = 'SCALE_OUT' | 'SCALE_IN' | 'RESIZE' | 'EXPAND_STORAGE' | 'START' | 'STOP';
export type ActionStatus =
    | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED'
    | 'REJECTED' | 'BLOCKED' | 'CANCELLED';

export type PolicyType = 'SAFETY_LIMIT' | 'APPROVAL_RULE';
export type AnomalyKind = 'TRAFFIC' | 'COST' | 'LATENCY' | 'ERROR_RATE' | 'HEALTH';
export type Channel = 'EMAIL' | 'WHATSAPP' | 'IN_APP';
export type NotificationEvent =
    | 'ALERT_CREATED' | 'RECOMMENDATION_CREATED' | 'APPROVAL_REQUESTED' | 'ACTION_COMPLETED'
    | 'ACTION_FAILED' | 'BUDGET_THRESHOLD' | 'COST_ANOMALY';
export type Interval = '1m' | '5m' | '15m' | '1h' | '1d';
export type ErrorCode =
    | 'VALIDATION_ERROR' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT'
    | 'POLICY_VIOLATION' | 'BUDGET_EXCEEDED' | 'RATE_LIMITED' | 'PROVIDER_ERROR' | 'INTERNAL_ERROR';

export interface PageMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface ApiSuccess<T> {
    success: true;
    data: T;
}

export interface ApiList<T> {
    success: true;
    data: T[];
    meta: PageMeta;
}

export interface ApiFailure {
    success: false;
    error: {
        code: ErrorCode;
        message: string;
        details?: { field?: string; reason: string }[];
    };
}

// ---- §6.2 Canonical metric names ----

export const METRIC_TABLE = {
    cpu_utilization: { unit: 'percent', applies: ['COMPUTE', 'DATABASE', 'CONTAINER'], downsample: 'avg' },
    memory_utilization: { unit: 'percent', applies: ['COMPUTE', 'DATABASE', 'CONTAINER'], downsample: 'avg' },
    request_rate: { unit: 'req_per_sec', applies: ['COMPUTE', 'CONTAINER', 'LOAD_BALANCER', 'STORAGE'], downsample: 'avg' },
    latency_p50_ms: { unit: 'ms', applies: ['COMPUTE', 'CONTAINER', 'LOAD_BALANCER'], downsample: 'avg' },
    latency_p95_ms: { unit: 'ms', applies: ['COMPUTE', 'CONTAINER', 'LOAD_BALANCER', 'DATABASE'], downsample: 'avg' },
    latency_p99_ms: { unit: 'ms', applies: ['COMPUTE', 'CONTAINER', 'LOAD_BALANCER'], downsample: 'avg' },
    error_rate: { unit: 'percent', applies: ['COMPUTE', 'CONTAINER', 'LOAD_BALANCER', 'STORAGE', 'DATABASE'], downsample: 'avg' },
    storage_used_gb: { unit: 'gb', applies: ['DATABASE', 'STORAGE'], downsample: 'last' },
    storage_utilization: { unit: 'percent', applies: ['DATABASE', 'STORAGE'], downsample: 'last' },
    network_in_mbps: { unit: 'mbps', applies: ['COMPUTE', 'CONTAINER', 'LOAD_BALANCER'], downsample: 'avg' },
    network_out_mbps: { unit: 'mbps', applies: ['COMPUTE', 'CONTAINER', 'LOAD_BALANCER'], downsample: 'avg' },
    uptime_percent: { unit: 'percent', applies: ['COMPUTE', 'DATABASE', 'STORAGE', 'LOAD_BALANCER', 'CONTAINER'], downsample: 'avg' },
    instance_count: { unit: 'count', applies: ['COMPUTE', 'CONTAINER'], downsample: 'max' },
} as const;

export type MetricName = keyof typeof METRIC_TABLE;

// ---- §6.3 Core models ----

export type Permission =
    | 'resources.read' | 'metrics.read' | 'costs.read' | 'recommendations.read' | 'actions.read'
    | 'policies.read' | 'ai.use'
    | 'actions.request'
    | 'actions.approve' | 'budgets.write' | 'audit.read' | 'resources.manage'
    | 'policies.write' | 'accounts.manage' | 'users.manage';

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    active: boolean;
    permissions: Permission[];
}

export type CloudCredentials =
    | { provider: 'AWS'; authType: 'ACCESS_KEY'; accessKeyId: string; secretAccessKey: string }
    | { provider: 'AWS'; authType: 'ASSUME_ROLE'; roleArn: string; externalId: string }
    | { provider: 'AZURE'; tenantId: string; clientId: string; clientSecret: string; subscriptionId: string }
    | { provider: 'GCP'; projectId: string; serviceAccountJson: string };

export interface CloudAccount {
    id: string;
    provider: Provider;
    name: string;
    externalAccountId: string;
    regions: string[];
    mode: 'MOCK' | 'LIVE';
    status: 'CONNECTED' | 'ERROR' | 'SYNCING';
    lastSyncedAt: string | null;
    resourceCount: number;
}

export interface Resource {
    id: string;
    accountId: string;
    provider: Provider;
    externalId: string;
    name: string;
    type: ResourceType;
    region: string;
    status: ResourceStatus;
    health: Health;
    size: string;
    quantity: number;
    minQuantity: number;
    maxQuantity: number;
    supportedActions: ActionType[];
    storageGb: number | null;
    monthlyCostUsd: number;
    tags: Record<string, string>;
    latest: {
        cpuUtilization: number | null;
        memoryUtilization: number | null;
        requestRate: number | null;
        latencyP95Ms: number | null;
        errorRate: number | null;
        storageUtilization: number | null;
    };
    lastSeenAt: string;
}

export interface ResourcePatch {
    tags?: Record<string, string>;
    minQuantity?: number;
    maxQuantity?: number;
}

export interface MetricPoint {
    t: string;
    v: number;
}

export interface MetricSeries {
    metric: string;
    unit: string;
    points: MetricPoint[];
}

export interface MoneyImpact {
    currentMonthlyCostUsd: number;
    projectedMonthlyCostUsd: number;
    deltaMonthlyUsd: number;
    deltaPercent: number;
    budget: {
        name: string;
        limitUsd: number;
        usedUsd: number;
        afterChangeUsd: number;
        withinBudget: boolean;
    } | null;
}

export interface ProposedAction {
    type: ActionType;
    params: {
        targetInstances?: number;
        targetSize?: string;
        targetStorageGb?: number;
    };
}

export interface ValidationResult {
    allowed: boolean;
    requiresApproval: boolean;
    approverRole: Role | null;
    checks: {
        name: 'PERMISSION' | 'POLICY' | 'BUDGET' | 'APPROVAL';
        passed: boolean;
        message: string;
    }[];
}

export interface Recommendation {
    id: string;
    resourceId: string;
    resourceName: string;
    provider: Provider;
    type: RecommendationType;
    status: RecommendationStatus;
    title: string;
    summary: string;
    confidence: number;
    severity: Severity;
    reason: { metric: string; observed: number; threshold: number; window: string }[];
    proposedAction: ProposedAction;
    costImpact: MoneyImpact;
    policyCheck: ValidationResult;
    createdAt: string;
    expiresAt: string;
}

export interface Action {
    id: string;
    resourceId: string | null;
    resourceName: string;
    recommendationId: string | null;
    type: ActionType;
    params: ProposedAction['params'];
    status: ActionStatus;
    requestedBy: { id: string; name: string };
    approvedBy: { id: string; name: string } | null;
    validation: ValidationResult;
    costImpact: MoneyImpact;
    result: { message: string; providerOperationId?: string } | null;
    error: string | null;
    createdAt: string;
    executedAt: string | null;
}

export interface Alert {
    id: string;
    severity: Severity;
    title: string;
    message: string;
    source: 'ANOMALY' | 'HEALTH' | 'BUDGET' | 'ACTION' | 'SYSTEM';
    resourceId: string | null;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
    createdAt: string;
}

export interface Anomaly {
    id: string;
    kind: AnomalyKind;
    severity: Severity;
    resourceId: string | null;
    resourceName: string | null;
    metric: string;
    expectedValue: number;
    observedValue: number;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
    detectedAt: string;
}

export interface Policy {
    id: string;
    name: string;
    type: PolicyType;
    enabled: boolean;
    priority: number;
    scope: {
        provider?: Provider;
        accountId?: string;
        resourceType?: ResourceType;
        tags?: Record<string, string>;
    };
    rules: SafetyLimitRules | ApprovalRules;
}

export interface SafetyLimitRules {
    maxInstances?: number;
    minInstances?: number;
    maxScaleStepPercent?: number;
    maxCostIncreasePerActionUsd?: number;
    blockedActions?: ActionType[];
    allowedWindows?: {
        days: number[];
        startHour: number;
        endHour: number;
        timezone: string;
    }[];
}

export interface ApprovalRules {
    requireApprovalWhen: {
        costDeltaMonthlyUsdGt?: number;
        actionTypeIn?: ActionType[];
    };
    approverRole: 'MANAGER' | 'ADMIN';
}

export interface Budget {
    id: string;
    name: string;
    scope: 'GLOBAL' | 'PROVIDER' | 'ACCOUNT' | 'TAG';
    scopeValue: string | null;
    amountUsd: number;
    period: 'MONTHLY';
    alertThresholds: number[];
    hardLimit: boolean;
    usedUsd: number;
    usedPercent: number;
    forecastUsd: number;
}

export interface Notification {
    id: string;
    channel: Channel;
    title: string;
    body: string;
    entityType: string | null;
    entityId: string | null;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationSetting {
    channel: Channel;
    enabled: boolean;
    events: NotificationEvent[];
    destination: string | null;
}

export interface AuditLog {
    id: string;
    actor: { id: string; name: string } | null;
    action: string;
    entityType: string;
    entityId: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    ts: string;
}

// ---- §6.4 Endpoint payload types ----

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
}

export interface DashboardOverview {
    resources: {
        total: number;
        byHealth: Record<Health, number>;
        byProvider: Record<Provider, number>;
    };
    traffic: { requestRate: number; changePercent: number };
    latency: { p95Ms: number; changePercent: number };
    uptime: { percent: number };
    storage: { usedGb: number; totalGb: number; utilizationPercent: number };
    cost: {
        monthToDateUsd: number;
        forecastEndOfMonthUsd: number;
        budgetUsd: number;
        budgetUsedPercent: number;
    };
    counts: { openAlerts: number; newRecommendations: number; pendingApprovals: number };
}

export interface MetricsSummary {
    traffic: { avg: number; peak: number; changePercent: number };
    latency: { p50Ms: number; p95Ms: number; p99Ms: number };
    uptimePercent: number;
    errorRate: number;
    storage: { usedGb: number; totalGb: number; utilizationPercent: number };
    healthCounts: Record<Health, number>;
}

export interface ResourceMetrics {
    resourceId: string;
    interval: Interval;
    series: MetricSeries[];
}

export interface GroupedSeries {
    key: string;
    points: MetricPoint[];
}

export interface MetricsTimeseries {
    metric: string;
    unit: string;
    interval: Interval;
    series: GroupedSeries[];
}

export interface ResourceHealthDetail {
    health: Health;
    uptimePercent: number;
    lastIncidentAt: string | null;
    checks: { name: string; status: 'PASS' | 'WARN' | 'FAIL'; message: string }[];
}

export interface ResourceCost {
    monthToDateUsd: number;
    forecastUsd: number;
    dailyCosts: { date: string; amountUsd: number }[];
}

export interface CostSummary {
    monthToDateUsd: number;
    forecastEndOfMonthUsd: number;
    lastMonthUsd: number;
    changePercent: number;
    budgetUsd: number;
    budgetUsedPercent: number;
    currency: 'USD';
}

export interface CostTimeseries {
    interval: Interval;
    series: GroupedSeries[];
}

export interface CostBreakdownItem {
    key: string;
    label: string;
    amountUsd: number;
    percent: number;
}

export interface CostForecast {
    points: { date: string; amountUsd: number; lower: number; upper: number }[];
    endOfMonthUsd: number;
}

export interface BillingStatement {
    id: string;
    accountId: string;
    provider: Provider;
    period: string;
    totalUsd: number;
    status: 'OPEN' | 'FINAL' | 'PAID';
    lines: { service: string; amountUsd: number }[];
}

export interface Trend {
    metric: string;
    slope: number;
    direction: 'UP' | 'DOWN' | 'FLAT';
    changePercent: number;
    forecastNext24h: number;
}

export type SuggestedAction =
    | { label: string; type: 'OPEN_RESOURCE'; payload: { resourceId: string } }
    | { label: string; type: 'OPEN_RECOMMENDATION'; payload: { recommendationId: string } }
    | { label: string; type: 'PREVIEW_ACTION'; payload: { resourceId: string; type: ActionType; params: ProposedAction['params'] } };

export interface AiExplanation {
    explanation: string;
    keyPoints: string[];
    generatedAt: string;
}

export interface AiSummary {
    summary: string;
    highlights: string[];
    generatedAt: string;
}

export interface AiChatReply {
    conversationId: string;
    reply: string;
    suggestedActions: SuggestedAction[];
}

export interface SystemHealth {
    status: 'UP' | 'DEGRADED';
    db: 'UP' | 'DOWN';
    version: string;
    providerMode: 'MOCK' | 'LIVE';
    demoControls: boolean;
}

// ---- §6.5 WebSocket message types ----

export interface RecommendationEvent {
    recommendationId: string;
    resourceId: string;
    resourceName: string;
    type: RecommendationType;
    title: string;
    severity: Severity;
}

export type WsServerMessage =
    | { event: 'metric.updated'; channel: string; ts: string; data: { resourceId: string; metric: string; unit: string; point: MetricPoint } }
    | { event: 'dashboard.updated'; channel: 'dashboard'; ts: string; data: Record<string, never> }
    | { event: 'resource.health_changed'; channel: 'dashboard'; ts: string; data: { resourceId: string; from: Health; to: Health } }
    | { event: 'anomaly.detected'; channel: 'alerts'; ts: string; data: Anomaly }
    | { event: 'alert.created' | 'alert.resolved'; channel: 'alerts'; ts: string; data: Alert }
    | { event: 'recommendation.created'; channel: 'recommendations'; ts: string; data: RecommendationEvent }
    | { event: 'action.status_changed'; channel: 'actions'; ts: string; data: { actionId: string; status: ActionStatus; message: string } }
    | { event: 'notification.created'; channel: 'user'; ts: string; data: Notification }
    | { event: 'pong'; channel: 'system'; ts: string; data: Record<string, never> };

export type WsClientMessage =
    | { action: 'subscribe' | 'unsubscribe'; channels: string[] }
    | { action: 'ping' };
