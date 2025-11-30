'use client';

import { SaleItem } from '@/types';
import { Trash2, Plus, Minus } from 'lucide-react';

interface BillingCartProps {
    items: SaleItem[];
    onUpdateQuantity: (productId: string, newQty: number) => void;
    onRemove: (productId: string) => void;
}

export function BillingCart({ items, onUpdateQuantity, onRemove }: BillingCartProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                <p>Cart is empty</p>
                <p className="text-sm">Scan items to start billing</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                    <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">#</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Product</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Qty</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
                        <th scope="col" className="relative px-3 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                    {items.map((item, index) => (
                        <tr key={item.productId}>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-neutral-500">
                                {index + 1}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                                {item.productName}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-neutral-500">
                                ₹{item.sellingPrice}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-neutral-500">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                                        className="p-1 rounded-full hover:bg-neutral-100 text-neutral-600"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                                        className="p-1 rounded-full hover:bg-neutral-100 text-neutral-600"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-neutral-900">
                                ₹{item.lineTotal.toFixed(2)}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => onRemove(item.productId)}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
