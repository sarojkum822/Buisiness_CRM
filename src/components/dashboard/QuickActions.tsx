'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ShoppingCart, UserPlus, ScanBarcode } from 'lucide-react';

export function QuickActions() {
    return (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Link
                    href="/sales"
                    className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <ShoppingCart size={20} />
                    </div>
                    <span className="text-sm font-medium text-neutral-900">New Sale</span>
                </Link>

                <Link
                    href="/products"
                    className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-all hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600"
                >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <Plus size={20} />
                    </div>
                    <span className="text-sm font-medium text-neutral-900">Add Product</span>
                </Link>

                <Link
                    href="/customers"
                    className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-all hover:bg-green-50 hover:border-green-200 hover:text-green-600"
                >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <UserPlus size={20} />
                    </div>
                    <span className="text-sm font-medium text-neutral-900">Add Customer</span>
                </Link>

                <Link
                    href="/stock/in"
                    className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-4 transition-all hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
                >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <ScanBarcode size={20} />
                    </div>
                    <span className="text-sm font-medium text-neutral-900">Scan Stock</span>
                </Link>
            </div>
        </div>
    );
}
