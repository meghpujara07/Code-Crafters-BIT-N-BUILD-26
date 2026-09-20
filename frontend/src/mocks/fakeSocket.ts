// ============================================================
// CloudOps Mock Data — Scripted Fake WebSocket (§11 Scenario)
// ============================================================

import { WsServerMessage } from '../api/types';

type EventHandler = (data: unknown, raw: { event: string; channel: string; ts: string }) => void;

class FakeSocketClient {
    private handlers = new Map<string, Set<EventHandler>>();
    private activeChannels = new Set<string>();
    private intervalId: number | null = null;
    public isConnected = false;

    public connect(token: string): void {
        if (!token) return;
        this.isConnected = true;
        console.log('[FakeWS] Connected with token:', token.substring(0, 15) + '...');
        this.startMockEventStream();
    }

    public subscribe(channels: string[]): void {
        channels.forEach(ch => this.activeChannels.add(ch));
        console.log('[FakeWS] Subscribed channels:', Array.from(this.activeChannels));
    }

    public unsubscribe(channels: string[]): void {
        channels.forEach(ch => this.activeChannels.delete(ch));
    }

    public on(event: string, handler: EventHandler): () => void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);

        return () => {
            this.handlers.get(event)?.delete(handler);
        };
    }

    private emit(event: string, channel: string, data: unknown): void {
        const raw = { event, channel, ts: new Date().toISOString() };
        const eventHandlers = this.handlers.get(event);
        if (eventHandlers) {
            eventHandlers.forEach(h => h(data, raw));
        }
        // Also support wildcard handlers if registered
        const wildcardHandlers = this.handlers.get('*');
        if (wildcardHandlers) {
            wildcardHandlers.forEach(h => h(data, raw));
        }
    }

    private startMockEventStream(): void {
        if (this.intervalId !== null) return;

        // Send a periodic metric update every 15 seconds in mock mode
        this.intervalId = window.setInterval(() => {
            if (!this.isConnected) return;

            const metricMessage: WsServerMessage = {
                event: 'metric.updated',
                channel: 'metrics',
                ts: new Date().toISOString(),
                data: {
                    resourceId: 'res-aws-chkout-01',
                    metric: 'cpu_utilization',
                    unit: 'percent',
                    point: {
                        t: new Date().toISOString(),
                        v: Math.round((50 + Math.random() * 30) * 10) / 10,
                    },
                },
            };

            this.emit(metricMessage.event, metricMessage.channel, metricMessage.data);
        }, 15000);
    }

    public disconnect(): void {
        this.isConnected = false;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

export const fakeSocket = new FakeSocketClient();
