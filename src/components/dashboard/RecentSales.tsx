'use client';

import React from 'react';
import { Sale } from '@/types';
import { Clock } from 'lucide-react';

interface RecentSalesProps {
    sales: Sale[];
    loading?: boolean;
}

export function RecentSales({ sales, loading = false }: RecentSalesProps) {
    if (loading) {
        return (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                    <div className="mb-2 h-6 w-32 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-4 w-24 animate-pulse rounded bg-neutral-100"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-neutral-50"></div>
                    ))}
                </div>
            </div>
        );
    }

    const recentSales = sales.slice(0, 5);

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-900">Recent Sales</h2>
                <Clock size={16} className="text-neutral-400" />
            </div>

            {recentSales.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="mb-2 text-4xl">🛒</div>
                    <p className="text-sm text-neutral-600">No sales yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {recentSales.map((sale) => (
                        <div
                            key={sale.id}
                            className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
                                    #{sale.invoiceNumber.slice(-4)}
                                </div>
                                <div>
                                    <div className="font-medium text-neutral-900">
                                        {sale.customerName || 'Walk-in Customer'}
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        {sale.items.length} items • {formatTimeAgo(sale.createdAt)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-neutral-900">
                                    ₹{sale.grandTotal.toLocaleString()}
                                </div>
                                <div className="text-xs font-medium text-green-600">
                                    {sale.paymentMode}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
