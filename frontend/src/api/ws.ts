// ============================================================
// CloudOps WebSocket Client — §9
// Singleton with ping, exponential backoff, 4401 refresh,
// channel subscription management, and generic event handler.
// ============================================================

import type { WsClientMessage, WsServerMessage } from './types';
import { useAuthStore } from '@/store/authStore';

type EventHandler = (data: unknown, raw: { event: string; channel: string; ts: string }) => void;

interface Subscription {
    event: string;
    handler: EventHandler;
}

class WsClient {
    private ws: WebSocket | null = null;
    private token: string | null = null;
    private channels: Set<string> = new Set();
    private subscriptions: Subscription[] = [];
    private pingInterval: ReturnType<typeof setInterval> | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private reconnectDelay = 1000;
    private maxReconnectDelay = 30000;
    private intentionalClose = false;
    private reconnectCallback: (() => void) | null = null;

    /** Connect to the WebSocket server with an access token. */
    connect(token: string): void {
        this.token = token;
        this.intentionalClose = false;
        this.doConnect();
    }

    /** Disconnect and stop reconnecting. */
    disconnect(): void {
        this.intentionalClose = true;
        this.cleanup();
    }

    /** Subscribe to one or more channels. */
    subscribe(channels: string[]): void {
        for (const ch of channels) {
            this.channels.add(ch);
        }
        this.sendSubscribe(channels);
    }

    /** Unsubscribe from one or more channels. */
    unsubscribe(channels: string[]): void {
        for (const ch of channels) {
            this.channels.delete(ch);
        }
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ action: 'unsubscribe', channels });
        }
    }

    /** Register an event handler. Returns an unsubscribe function. */
    on(event: string, handler: EventHandler): () => void {
        const sub: Subscription = { event, handler };
        this.subscriptions.push(sub);
        return () => {
            const idx = this.subscriptions.indexOf(sub);
            if (idx >= 0) this.subscriptions.splice(idx, 1);
        };
    }

    /** Set a callback that fires on every (re)connect. */
    onReconnect(cb: () => void): void {
        this.reconnectCallback = cb;
    }

    // ---- Private ----

    private getWsUrl(): string {
        const envUrl = import.meta.env.VITE_WS_URL;
        if (envUrl) {
            return `${envUrl}?token=${this.token}`;
        }
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${proto}//${window.location.host}/ws?token=${this.token}`;
    }

    private doConnect(): void {
        if (!this.token) return;
        this.cleanup();

        try {
            this.ws = new WebSocket(this.getWsUrl());
        } catch {
            this.scheduleReconnect();
            return;
        }

        this.ws.onopen = () => {
            this.reconnectDelay = 1000; // Reset backoff on success

            // Start pinging every 25s
            this.pingInterval = setInterval(() => {
                this.send({ action: 'ping' });
            }, 25000);

            // Re-subscribe to tracked channels
            if (this.channels.size > 0) {
                this.sendSubscribe([...this.channels]);
            }

            // Fire reconnect callback (consumers invalidate queries here)
            this.reconnectCallback?.();
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data) as WsServerMessage;
                this.dispatch(msg);
            } catch {
                // Ignore malformed messages
            }
        };

        this.ws.onclose = (event) => {
            this.stopPing();

            if (this.intentionalClose) return;

            // 4401 = token expired — refresh then reconnect
            if (event.code === 4401) {
                this.handleTokenRefresh();
                return;
            }

            this.scheduleReconnect();
        };

        this.ws.onerror = () => {
            // The close handler will fire after this; no need to reconnect here.
        };
    }

    private dispatch(msg: WsServerMessage): void {
        for (const sub of this.subscriptions) {
            if (sub.event === msg.event) {
                sub.handler(msg.data, { event: msg.event, channel: msg.channel, ts: msg.ts });
            }
        }
    }

    private send(msg: WsClientMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    private sendSubscribe(channels: string[]): void {
        if (channels.length > 0) {
            this.send({ action: 'subscribe', channels });
        }
    }

    private async handleTokenRefresh(): Promise<void> {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) return;

        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        try {
            const res = await fetch(`${baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    const { accessToken, user } = json.data;
                    const currentUser = useAuthStore.getState().user;
                    useAuthStore.getState().login(
                        user || currentUser!,
                        accessToken,
                        json.data.refreshToken || refreshToken,
                    );
                    this.token = accessToken;
                    this.doConnect();
                    return;
                }
            }
        } catch {
            // Fall through to reconnect
        }

        this.scheduleReconnect();
    }

    private scheduleReconnect(): void {
        if (this.intentionalClose) return;

        this.reconnectTimer = setTimeout(() => {
            this.doConnect();
        }, this.reconnectDelay);

        // Exponential backoff: 1s → 2s → 4s → ... → 30s
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private cleanup(): void {
        this.stopPing();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }
            this.ws = null;
        }
    }
}

/** Singleton WebSocket client for the entire app. */
export const wsClient = new WsClient();
