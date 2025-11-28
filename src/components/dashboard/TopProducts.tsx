'use client';

import React from 'react';
import { Product } from '@/types';

interface TopProductsProps {
    products: Product[];
    loading?: boolean;
}

export function TopProducts({ products, loading = false }: TopProductsProps) {
    if (loading) {
        return (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <div className="mb-4">
                    <div className="mb-2 h-6 w-32 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-4 w-20 animate-pulse rounded bg-neutral-100"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i}>
                            <div className="mb-1 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 animate-pulse rounded-full bg-neutral-200"></div>
                                    <div className="h-4 w-32 animate-pulse rounded bg-neutral-200"></div>
                                </div>
                                <div className="h-4 w-16 animate-pulse rounded bg-neutral-200"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 animate-pulse rounded-full bg-neutral-100"></div>
                                <div className="h-3 w-12 animate-pulse rounded bg-neutral-100"></div>
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
        .slice(0, 5);

    const maxRevenue = topProducts.length > 0 ? topProducts[0].totalRevenue : 1;

    return (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Top Products</h2>
                <p className="text-sm text-neutral-600">By revenue</p>
            </div>

            {topProducts.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="mb-2 text-4xl">📊</div>
                    <p className="text-sm text-neutral-600">No sales data yet</p>
                    <p className="mt-1 text-xs text-neutral-500">
                        Create your first sale to see top products
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {topProducts.map((product, index) => {
                        const percentage = (product.totalRevenue / maxRevenue) * 100;
                        return (
                            <div key={product.id}>
                                <div className="mb-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-neutral-900">{product.name}</span>
                                    </div>
                                    <span className="text-sm font-medium text-neutral-900">
                                        ₹{product.totalRevenue.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-neutral-600">
                                        {product.totalSoldQty} sold
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
