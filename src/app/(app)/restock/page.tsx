'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product } from '@/types';

export default function RestockPage() {
    const { orgId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (orgId) {
            fetchLowStockProducts();
        }
    }, [orgId]);

    const fetchLowStockProducts = async () => {
        try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('orgId', '==', orgId), orderBy('name', 'asc'));
            const snapshot = await getDocs(q);

            const lowStockItems: Product[] = [];
            const initialQuantities: Record<string, number> = {};

            snapshot.forEach((doc) => {
                const data = doc.data() as Product;
                const threshold = data.lowStockThreshold || 5;
                if (data.currentStock <= threshold) {
                    lowStockItems.push({ id: doc.id, ...data });
                    // Calculate initial suggested quantity
                    const deficit = threshold - data.currentStock;
                    initialQuantities[doc.id] = deficit + 10;
                }
            });

            setProducts(lowStockItems);
            setQuantities(initialQuantities);
        } catch (error) {
            console.error('Error fetching restock list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (productId: string, value: string) => {
        const numValue = parseInt(value) || 0;
        setQuantities(prev => ({
            ...prev,
            [productId]: numValue
        }));
    };

    const handleCopyList = () => {
        // Filter out items with 0 quantity
        const itemsToOrder = products.filter(p => (quantities[p.id!] || 0) > 0);

        if (itemsToOrder.length === 0) {
            alert("No items to order!");
            return;
        }

        const text = itemsToOrder.map(p => {
            return `${p.name}: ${quantities[p.id!] || 0}`;
        }).join('\n');

        const header = `📋 *Restock List*\n\n`;
        navigator.clipboard.writeText(header + text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Smart Restock List 📝</h1>
                    <p className="text-neutral-600">Items that are running low and need to be ordered.</p>
                </div>
                {products.length > 0 && (
                    <button
                        onClick={handleCopyList}
                        className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
                    >
                        {copied ? (
                            <>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy List
                            </>
                        )}
                    </button>
                )}
            </div>

            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900">All Stocked Up! 🎉</h3>
                    <p className="mt-2 max-w-sm text-neutral-500">
                        Great job! All your products are above their minimum stock levels.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 text-neutral-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Product Name</th>
                                <th className="px-6 py-4 font-medium text-center">Current Stock</th>
                                <th className="px-6 py-4 font-medium text-center">Min Level</th>
                                <th className="px-6 py-4 font-medium text-center">To Order</th>
                                <th className="px-6 py-4 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {products.map((product) => {
                                const threshold = product.lowStockThreshold || 5;

                                return (
                                    <tr key={product.id} className="group hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-900">{product.name}</div>
                                            <div className="text-xs text-neutral-500">{product.category}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
                                                {product.currentStock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-neutral-600">
                                            {threshold}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={quantities[product.id!] || 0}
                                                    onChange={(e) => handleQuantityChange(product.id!, e.target.value)}
                                                    className="w-20 rounded-md border-neutral-300 py-1 text-center text-sm font-semibold text-neutral-900 focus:border-neutral-900 focus:ring-neutral-900"
                                                />
                                                <span className="text-xs text-neutral-500">units</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                Low Stock
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
