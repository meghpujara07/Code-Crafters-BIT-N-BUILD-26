// ============================================================
// CloudOps — App Layout Shell
// ============================================================

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './Layout.css';

export function AppLayout() {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="app-main">
                <Header />
                <main className="content-body">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
