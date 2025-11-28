'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ShopAssistant } from '@/components/dashboard/ShopAssistant';

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const { user, orgId, loading, orgLoading } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !orgLoading && (!user || !orgId)) {
            router.push('/');
        }
    }, [user, orgId, loading, orgLoading, router]);

    // Show loading state
    if (loading || orgLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
                    <p className="text-sm text-neutral-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (!user || !orgId) {
        return null;
    }

    return (
        <div className="flex h-screen bg-neutral-50">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <TopBar onMenuClick={() => setSidebarOpen(true)} />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
                <ShopAssistant />
            </div>
        </div>
    );
}
