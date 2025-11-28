'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';

interface TopBarProps {
    onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const { user, orgName, logout } = useAuth();

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-6">
            {/* Left: Mobile menu + Org name */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="text-neutral-700 hover:text-neutral-900 md:hidden"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="hidden md:block">
                    <h2 className="text-sm font-medium text-neutral-900">{orgName || 'My Shop'}</h2>
                </div>
            </div>

            {/* Right: User info + Logout */}
            <div className="flex items-center gap-3">
                {/* User avatar */}
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white">
                        {getInitials(user?.displayName || user?.email || null)}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-neutral-900">
                            {user?.displayName || user?.email}
                        </p>
                    </div>
                </div>

                {/* Logout button */}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
        </header>
    );
}
