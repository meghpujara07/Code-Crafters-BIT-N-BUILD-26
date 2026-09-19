// ============================================================
// MSW Browser Worker — setupWorker with handlers.
// Proves the MSW plumbing works before any endpoint is mocked.
// ============================================================

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
