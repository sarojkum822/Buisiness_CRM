'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ShoppingCart, UserPlus, Package } from 'lucide-react';

export function QuickActions() {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-neutral-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
                <Link
                    href="/billing"
                    className="flex flex-col items-center justify-center rounded-lg border border-neutral-100 bg-blue-50 p-4 transition-all hover:bg-blue-100 hover:shadow-sm"
                >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-blue-700">
                        <ShoppingCart size={18} />
                    </div>
                    <span className="text-xs font-semibold text-blue-900">New Sale</span>
                </Link>

                <Link
                    href="/products"
                    className="flex flex-col items-center justify-center rounded-lg border border-neutral-100 bg-purple-50 p-4 transition-all hover:bg-purple-100 hover:shadow-sm"
                >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 text-purple-700">
                        <Plus size={18} />
                    </div>
                    <span className="text-xs font-semibold text-purple-900">Add Product</span>
                </Link>

                <Link
                    href="/customers"
                    className="flex flex-col items-center justify-center rounded-lg border border-neutral-100 bg-green-50 p-4 transition-all hover:bg-green-100 hover:shadow-sm"
                >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-200 text-green-700">
                        <UserPlus size={18} />
                    </div>
                    <span className="text-xs font-semibold text-green-900">Add Customer</span>
                </Link>

                <Link
                    href="/restock"
                    className="flex flex-col items-center justify-center rounded-lg border border-neutral-100 bg-orange-50 p-4 transition-all hover:bg-orange-100 hover:shadow-sm"
                >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-200 text-orange-700">
                        <Package size={18} />
                    </div>
                    <span className="text-xs font-semibold text-orange-900">Restock</span>
                </Link>
            </div>
        </div>
    );
}
