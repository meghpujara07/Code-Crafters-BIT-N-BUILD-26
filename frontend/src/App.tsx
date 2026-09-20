// ============================================================
// CloudOps App — Root component
// QueryClientProvider + BrowserRouter + Toaster
// ============================================================

import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { AppRoutes } from './routes';

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AppRoutes />
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: 'var(--surface)',
                            border: '1px solid var(--border-strong)',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-family)',
                            fontSize: '14px',
                            borderRadius: 'var(--radius-md)',
                        },
                    }}
                    gap={8}
                />
            </BrowserRouter>
        </QueryClientProvider>
    );
}
