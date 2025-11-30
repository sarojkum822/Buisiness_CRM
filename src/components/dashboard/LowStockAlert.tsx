'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface LowStockAlertProps {
    products: Product[];
    loading?: boolean;
}

export function LowStockAlert({ products, loading = false }: LowStockAlertProps) {
    if (loading) {
        return (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div className="h-6 w-32 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-4 w-16 animate-pulse rounded bg-neutral-100"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-neutral-50"></div>
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
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900">Low Stock Alert</h2>
                    {lowStockProducts.length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                            {lowStockProducts.length}
                        </span>
                    )}
                </div>
                <Link
                    href="/restock"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    View All
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
                            className="flex items-center justify-between rounded-lg border border-neutral-100 bg-white p-3 shadow-sm transition-all hover:border-neutral-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${product.currentStock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                    <AlertTriangle size={16} />
                                </div>
                                <div>
                                    <div className="font-medium text-neutral-900">{product.name}</div>
                                    <div className="text-xs text-neutral-500">
                                        Threshold: {product.lowStockThreshold}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold ${product.currentStock === 0 ? 'text-red-600' : 'text-orange-600'
                                    }`}>
                                    {product.currentStock} left
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
