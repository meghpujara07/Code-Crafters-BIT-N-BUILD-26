// ============================================================
// CloudOps App Entry — main.tsx
// Conditionally starts MSW, then renders App.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

async function bootstrap() {
    // Start MSW mock service worker in dev unless explicitly disabled
    const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false';
    if (useMocks) {
        const { worker } = await import('./mocks/browser');
        await worker.start({
            onUnhandledRequest: 'bypass',
        });
        console.log('[CloudOps] MSW mock server initialized successfully');
    }

    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}

bootstrap();
