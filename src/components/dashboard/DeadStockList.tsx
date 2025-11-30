'use client';

import React from 'react';
import { Product } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface DeadStockListProps {
    products: Product[];
    loading?: boolean;
}

export function DeadStockList({ products, loading = false }: DeadStockListProps) {
    if (loading) {
        return (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <div className="mb-4">
                    <div className="mb-2 h-6 w-48 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-4 w-32 animate-pulse rounded bg-neutral-100"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-100 p-3">
                            <div className="h-4 w-32 animate-pulse rounded bg-neutral-100"></div>
                            <div className="h-4 w-16 animate-pulse rounded bg-neutral-100"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Filter products with no sales in last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const deadStock = products
        .filter(p => {
            // If never sold, check creation date
            if (!p.lastSaleDate) {
                return new Date(p.createdAt) < sixtyDaysAgo;
            }
            // If sold, check last sale date
            return new Date(p.lastSaleDate) < sixtyDaysAgo;
        })
        .filter(p => p.currentStock > 0) // Only show items in stock
        .sort((a, b) => b.currentStock * b.costPrice - a.currentStock * a.costPrice) // Sort by stuck value
        .slice(0, 5);

    return (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Slow Moving Items</h2>
                    <p className="text-sm text-neutral-600">No sales in 60+ days</p>
                </div>
            </div>

            {deadStock.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-center">
                    <div>
                        <div className="mb-2 text-4xl">🚀</div>
                        <p className="text-sm text-neutral-600">Great job! No dead stock found.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {deadStock.map((product) => (
                        <div key={product.id} className="flex items-center justify-between rounded-lg border border-neutral-100 p-3 transition-colors hover:bg-neutral-50">
                            <div>
                                <p className="font-medium text-neutral-900">{product.name}</p>
                                <p className="text-xs text-neutral-500">
                                    Last sold: {product.lastSaleDate ? new Date(product.lastSaleDate).toLocaleDateString() : 'Never'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-orange-600">
                                    {product.currentStock} units
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Value: ₹{(product.currentStock * product.costPrice).toFixed(0)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
