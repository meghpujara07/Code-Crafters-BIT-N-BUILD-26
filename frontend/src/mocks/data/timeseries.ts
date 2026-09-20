// ============================================================
// CloudOps Mock Data — Deterministic Time Series Generator (§11)
// ============================================================

import { MetricPoint, MetricSeries, Interval } from '../../api/types';

export function generateMetricPoints(
    baseValue: number,
    variancePercent: number,
    count: number = 60,
    intervalMinutes: number = 5
): MetricPoint[] {
    const points: MetricPoint[] = [];
    const now = Date.now();
    const stepMs = intervalMinutes * 60 * 1000;

    for (let i = count - 1; i >= 0; i--) {
        const time = new Date(now - i * stepMs).toISOString();
        // Deterministic pseudo-random variation based on index
        const wave = Math.sin(i * 0.3) * 0.5 + Math.cos(i * 0.7) * 0.5;
        const factor = 1 + wave * (variancePercent / 100);
        const value = Math.max(0, Math.round((baseValue * factor) * 100) / 100);
        points.push({ t: time, v: value });
    }

    return points;
}

export function generateResourceSeries(
    resourceId: string,
    metric: string,
    unit: string,
    baseValue: number,
    interval: Interval = '5m'
): MetricSeries {
    const intervalMap: Record<Interval, { count: number; mins: number }> = {
        '1m': { count: 60, mins: 1 },
        '5m': { count: 60, mins: 5 },
        '15m': { count: 48, mins: 15 },
        '1h': { count: 24, mins: 60 },
        '1d': { count: 30, mins: 1440 },
    };

    const config = intervalMap[interval] || intervalMap['5m'];
    return {
        metric,
        unit,
        points: generateMetricPoints(baseValue, 15, config.count, config.mins),
    };
}
