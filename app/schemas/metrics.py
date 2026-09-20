"""Metric schemas for Person 3 APIs.

Conforms to ARCHITECTURE.md §6.3 and §6.4.
"""

from typing import Optional
from app.schemas.base import CamelModel


class MetricPoint(CamelModel):
    t: str
    v: float


class MetricSeries(CamelModel):
    metric: str
    unit: str
    points: list[MetricPoint] = []


class ResourceMetrics(CamelModel):
    resource_id: str
    interval: str
    series: list[MetricSeries] = []


class GroupedSeries(CamelModel):
    key: str
    points: list[MetricPoint] = []


class MetricsTimeseries(CamelModel):
    metric: str
    unit: str
    interval: str
    series: list[GroupedSeries] = []


class TrafficSummary(CamelModel):
    avg: float
    peak: float
    change_percent: float


class LatencySummary(CamelModel):
    p50_ms: float
    p95_ms: float
    p99_ms: float


class StorageSummary(CamelModel):
    used_gb: float
    total_gb: float
    utilization_percent: float


class MetricsSummary(CamelModel):
    traffic: TrafficSummary
    latency: LatencySummary
    uptime_percent: float
    error_rate: float
    storage: StorageSummary
    health_counts: dict[str, int]
