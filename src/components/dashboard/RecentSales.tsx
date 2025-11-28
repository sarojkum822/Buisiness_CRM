'use client';

import React from 'react';
import { Sale } from '@/types';

interface RecentSalesProps {
    sales: Sale[];
    loading?: boolean;
}

export function RecentSales({ sales, loading = false }: RecentSalesProps) {
    if (loading) {
        return (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <div className="mb-4">
                    <div className="mb-2 h-6 w-32 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-4 w-24 animate-pulse rounded bg-neutral-100"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                            <div className="w-full">
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="h-4 w-24 animate-pulse rounded bg-neutral-200"></div>
                                    <div className="h-4 w-32 animate-pulse rounded bg-neutral-100"></div>
                                </div>
                                <div className="h-3 w-48 animate-pulse rounded bg-neutral-100"></div>
                            </div>
                            <div className="ml-4 text-right">
                                <div className="mb-1 h-5 w-20 animate-pulse rounded bg-neutral-200"></div>
                                <div className="h-3 w-16 animate-pulse rounded bg-neutral-100"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const recentSales = sales.slice(0, 5);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Recent Sales</h2>
                <p className="text-sm text-neutral-600">Latest transactions</p>
            </div>

            {recentSales.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="mb-2 text-4xl">🛒</div>
                    <p className="text-sm text-neutral-600">No sales yet</p>
                    <p className="mt-1 text-xs text-neutral-500">
                        Record your first sale to see activity here
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {recentSales.map((sale) => (
                        <div
                            key={sale.id}
                            className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-medium text-neutral-900">
                                        {sale.invoiceNumber}
                                    </span>
                                    {sale.customerName && (
                                        <span className="text-sm text-neutral-600">• {sale.customerName}</span>
                                    )}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                                    <span>{formatDate(sale.createdAt)}</span>
                                    <span>•</span>
                                    <span>{sale.items.length} items</span>
                                    <span>•</span>
                                    <span className="capitalize">{sale.paymentMode}</span>
                                </div>
                            </div>
                            <div className="ml-4 text-right">
                                <div className="font-semibold text-neutral-900">
                                    ₹{sale.grandTotal.toFixed(2)}
                                </div>
                                <div className="text-xs text-green-600">
                                    +₹{(sale.grandTotal - sale.totalCost).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
