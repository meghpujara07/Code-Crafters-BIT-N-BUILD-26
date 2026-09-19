// ============================================================
// CloudOps Mock MSW Handlers
// ============================================================

import { http, HttpResponse } from 'msw';
import { MOCK_USERS } from './data/users';
import { MOCK_RESOURCES } from './data/resources';
import { ApiSuccess, ApiFailure, LoginResponse, SystemHealth } from '../api/types';

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

        const successResponse: ApiSuccess<LoginResponse> = {
            success: true,
            data,
        };

        return HttpResponse.json(successResponse);
    }),

    // ---- POST /api/v1/auth/refresh ----
    http.post('/api/v1/auth/refresh', async ({ request }) => {
        const body = (await request.json()) as { refreshToken?: string };

        if (!body.refreshToken) {
            const errorResponse: ApiFailure = {
                success: false,
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'Refresh token missing',
                },
            };
            return HttpResponse.json(errorResponse, { status: 401 });
        }

        // Default to admin user on refresh in mock mode if user state unavailable
        const user = MOCK_USERS[0];

        const data: LoginResponse = {
            accessToken: `mock-access-token-refreshed-${Date.now()}`,
            refreshToken: `mock-refresh-token-refreshed-${Date.now()}`,
            expiresIn: 3600,
            user,
        };

        const successResponse: ApiSuccess<LoginResponse> = {
            success: true,
            data,
        };

        return HttpResponse.json(successResponse);
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

        const response: ApiSuccess<SystemHealth> = {
            success: true,
            data,
        };

        return HttpResponse.json(response);
    }),

    // ---- GET /api/v1/resources (Stub list for early development) ----
    http.get('/api/v1/resources', () => {
        return HttpResponse.json({
            success: true,
            data: MOCK_RESOURCES,
            meta: {
                page: 1,
                pageSize: 50,
                total: MOCK_RESOURCES.length,
                totalPages: 1,
            },
        });
    }),
];
