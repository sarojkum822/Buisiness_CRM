'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';

interface LowStockAlertProps {
    products: Product[];
    loading?: boolean;
}

export function LowStockAlert({ products, loading = false }: LowStockAlertProps) {
    if (loading) {
        return (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="h-6 w-32 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-4 w-16 animate-pulse rounded bg-neutral-100"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
                            <div className="w-full">
                                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-neutral-200"></div>
                                <div className="h-3 w-32 animate-pulse rounded bg-neutral-100"></div>
                            </div>
                            <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const lowStockProducts = products
        .filter((p) => p.currentStock <= p.lowStockThreshold)
        .sort((a, b) => a.currentStock - b.currentStock)
        .slice(0, 5);

    return (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Low Stock Alert</h2>
                <Link
                    href="/products"
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                    View All →
                </Link>
            </div>

            {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="mb-2 text-4xl">✅</div>
                    <p className="text-sm text-neutral-600">All products are well stocked!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                        <div
                            key={product.id}
                            className="flex items-center justify-between rounded-lg bg-orange-50 p-3"
                        >
                            <div className="flex-1">
                                <div className="font-medium text-neutral-900">{product.name}</div>
                                <div className="text-sm text-neutral-600">
                                    Stock: {product.currentStock} / Threshold: {product.lowStockThreshold}
                                </div>
                            </div>
                            <div className="ml-4">
                                {product.currentStock === 0 ? (
                                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                        Out of Stock
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                                        Low Stock
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
