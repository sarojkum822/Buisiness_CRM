'use client';

import React from 'react';
import { Product } from '@/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopProductsProps {
    products: Product[];
    loading?: boolean;
}

export function TopProducts({ products, loading = false }: TopProductsProps) {
    if (loading) {
        return (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                    <div className="mb-2 h-6 w-32 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-4 w-20 animate-pulse rounded bg-neutral-100"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-100"></div>
                            <div className="flex-1">
                                <div className="mb-1 h-4 w-24 animate-pulse rounded bg-neutral-200"></div>
                                <div className="h-3 w-16 animate-pulse rounded bg-neutral-100"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const topProducts = products
        .filter((p) => p.totalRevenue > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 3);

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-900">Top Products</h2>
                <span className="text-xs font-medium text-neutral-500">By Revenue</span>
            </div>

            {topProducts.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="mb-2 text-4xl">📊</div>
                    <p className="text-sm text-neutral-600">No sales data yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="truncate font-medium text-neutral-900">{product.name}</h4>
                                <p className="text-xs text-neutral-500">{product.totalSoldQty} units sold</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-neutral-900">₹{product.totalRevenue.toLocaleString()}</p>
                                <div className="flex items-center justify-end gap-1 text-xs text-green-600">
                                    <TrendingUp size={12} />
                                    <span>Top</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
