// ============================================================
// CloudOps — Login Hook
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, ApiError } from '../../api/client';
import { wsClient } from '../../api/ws';
import { fakeSocket } from '../../mocks/fakeSocket';
import { useAuthStore } from '../../store/authStore';
import { LoginResponse } from '../../api/types';
import { toast } from 'sonner';

export function useLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loginToStore = useAuthStore(state => state.login);
    const navigate = useNavigate();

    const handleLogin = async (email: string, password: string = 'Passw0rd!') => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await apiClient.post<LoginResponse>('/auth/login', {
                email,
                password,
            });

            // Update Zustand store
            loginToStore(data.user, data.accessToken, data.refreshToken);

            // Connect WebSocket seam (use fakeSocket in mock mode if VITE_USE_MOCKS is active)
            const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';
            if (useMocks) {
                fakeSocket.connect(data.accessToken);
            } else {
                wsClient.connect(data.accessToken);
            }

            toast.success(`Welcome back, ${data.user.name}`);
            navigate('/dashboard');
        } catch (err: unknown) {
            const apiErr = err as ApiError;
            const message = apiErr?.message || 'Login failed. Please check your credentials.';
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        login: handleLogin,
        isLoading,
        error,
    };
}
