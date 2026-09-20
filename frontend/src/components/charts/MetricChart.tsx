// ============================================================
// CloudOps — Reusable Time Series Metric Chart
// Recharts container with CSS Studio theme styling & Glassmorphism Tooltip
// ============================================================

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from 'recharts';
import { MetricSeries, GroupedSeries } from '../../api/types';

interface MetricChartProps {
    series?: MetricSeries[] | GroupedSeries[];
    height?: number;
    unit?: string;
    showLegend?: boolean;
    colors?: string[];
    title?: string;
}

const DEFAULT_COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f43f5e', '#a78bfa'];

function CustomTooltip({ active, payload, label, unit }: any) {
    if (active && payload && payload.length) {
        return (
            <div
                style={{
                    background: 'var(--surface-secondary)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: 170,
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 8,
                        paddingBottom: 6,
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <span>{label}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {payload.map((entry: any, index: number) => (
                        <div
                            key={`item-${index}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 16,
                                fontSize: 12,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: entry.color,
                                        display: 'inline-block',
                                        boxShadow: `0 0 8px ${entry.color}`,
                                    }}
                                />
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{entry.name}:</span>
                            </div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'monospace' }}>
                                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value} {unit}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}

export function MetricChart({
    series = [],
    height = 240,
    unit = '',
    showLegend = false,
    colors = DEFAULT_COLORS,
    title,
}: MetricChartProps) {
    // Normalize series data into recharts wide format
    // Format: [{ t: timestamp, [seriesKey1]: val1, [seriesKey2]: val2 }]
    if (!series || series.length === 0) {
        return (
            <div
                style={{
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 8,
                }}
            >
                No metric data available
            </div>
        );
    }

    // Map series to wide data points by timestamp
    const timeMap = new Map<string, Record<string, any>>();
    const seriesKeys: string[] = [];

    series.forEach((s, idx) => {
        const key = 'metric' in s ? s.metric : (s as GroupedSeries).key || `Series ${idx + 1}`;
        seriesKeys.push(key);

        s.points.forEach(p => {
            const timeStr = typeof p.t === 'string' ? p.t : new Date(p.t).toISOString();
            const formattedTime = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr;

            if (!timeMap.has(formattedTime)) {
                timeMap.set(formattedTime, { time: formattedTime });
            }
            const entry = timeMap.get(formattedTime)!;
            entry[key] = p.v;
        });
    });

    const chartData = Array.from(timeMap.values());

    return (
        <div style={{ width: '100%' }}>
            {title && (
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {title} {unit ? `(${unit})` : ''}
                </div>
            )}
            <div style={{ width: '100%', height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            {seriesKeys.map((key, i) => {
                                const color = colors[i % colors.length];
                                return (
                                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--border-subtle)' }}
                        />
                        <YAxis
                            stroke="var(--text-muted)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={val => `${val}${unit ? unit.slice(0, 3) : ''}`}
                        />
                        <Tooltip content={<CustomTooltip unit={unit} />} />
                        {showLegend && (
                            <Legend
                                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                                iconType="circle"
                            />
                        )}
                        {seriesKeys.map((key, i) => {
                            const color = colors[i % colors.length];
                            return (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={color}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill={`url(#grad-${key})`}
                                />
                            );
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
