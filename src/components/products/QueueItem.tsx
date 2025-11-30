'use client';

import React from 'react';
import { Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QueuedItemData {
    id: string;
    type: 'new' | 'update';
    barcode: string;
    productId?: string;
    originalStock?: number;
    data: {
        name: string;
        sku: string;
        barcode: string;
        category: string;
        costPrice: number;
        sellingPrice: number;
        currentStock: number;
        lowStockThreshold: number;
    };
}

interface QueueItemProps {
    item: QueuedItemData;
    onEdit: (item: QueuedItemData) => void;
    onDelete: (id: string) => void;
}

export function QueueItem({ item, onEdit, onDelete }: QueueItemProps) {
    const stockChange = item.originalStock !== undefined
        ? item.data.currentStock - item.originalStock
        : item.data.currentStock;

    const isNew = item.type === 'new';

    return (
        <div className={`rounded-lg border p-4 transition-all hover:shadow-md ${isNew
                ? 'border-green-200 bg-green-50/50'
                : 'border-blue-200 bg-blue-50/50'
            }`}>
            <div className="flex items-start gap-3">
                {/* Product Icon */}
                <div className={`flex-shrink-0 rounded-lg p-2 ${isNew ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                    <Package className={`h-5 w-5 ${isNew ? 'text-green-600' : 'text-blue-600'
                        }`} />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-neutral-900 truncate">
                                {item.data.name}
                            </h4>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                                <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded">
                                    {item.data.barcode}
                                </span>
                                <span className="text-neutral-400">•</span>
                                <span>{item.data.sku}</span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${isNew
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                            {isNew ? 'NEW' : 'UPDATED'}
                        </span>
                    </div>

                    {/* Stock Info */}
                    <div className="mt-2 flex items-center gap-4 text-sm">
                        <div>
                            <span className="text-neutral-600">Stock: </span>
                            {item.originalStock !== undefined ? (
                                <span className="font-medium">
                                    <span className="text-neutral-400">{item.originalStock}</span>
                                    {' → '}
                                    <span className="text-neutral-900">{item.data.currentStock}</span>
                                    <span className="ml-1 text-green-600 font-bold">
                                        (+{stockChange})
                                    </span>
                                </span>
                            ) : (
                                <span className="font-medium text-green-600">
                                    +{item.data.currentStock}
                                </span>
                            )}
                        </div>
                        <div className="text-neutral-500">
                            ₹{item.data.sellingPrice}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                        onClick={() => onEdit(item)}
                        className="rounded p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-blue-600 transition-colors"
                        title="Edit"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="rounded p-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-red-600 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
