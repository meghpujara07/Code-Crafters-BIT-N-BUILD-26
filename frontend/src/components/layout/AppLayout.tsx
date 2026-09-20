// ============================================================
// CloudOps — App Layout Shell
// ============================================================

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarStore } from '../../store/sidebarStore';
import './Layout.css';

export function AppLayout() {
    const { isCollapsed } = useSidebarStore();

    return (
        <div className="app-shell">
            <Sidebar />
            <div className={`app-main ${isCollapsed ? 'collapsed-main' : ''}`}>
                <Header />
                <main className="content-body">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
