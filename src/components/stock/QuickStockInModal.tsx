'use client';

import { useState } from 'react';
import { Product } from '@/types';
import { adjustStock } from '@/lib/firestore/products';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface QuickStockInModalProps {
    product: Product;
    orgId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function QuickStockInModal({ product, orgId, onClose, onSuccess }: QuickStockInModalProps) {
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState(product.costPrice.toString());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const qty = parseInt(quantity);
        const cost = parseFloat(unitCost);

        if (isNaN(qty) || qty <= 0) {
            setError('Please enter a valid quantity');
            return;
        }

        if (isNaN(cost) || cost < 0) {
            setError('Please enter a valid unit cost');
            return;
        }

        setLoading(true);

        try {
            await adjustStock(orgId, product.id!, {
                type: 'IN',
                quantity: qty,
                unitCost: cost,
                reason: 'Stock-in via barcode scanner',
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error adding stock:', err);
            setError(err.message || 'Failed to add stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-neutral-900">Quick Stock In</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-900"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4 rounded-lg bg-blue-50 p-3">
                    <div className="text-sm font-medium text-blue-900">{product.name}</div>
                    <div className="mt-1 text-xs text-blue-700">
                        SKU: {product.sku} {product.barcode && `• Barcode: ${product.barcode}`}
                    </div>
                    <div className="mt-1 text-xs text-blue-700">
                        Current Stock: {product.currentStock}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <Input
                            label="Quantity to Add"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                            required
                            min="1"
                            autoFocus
                        />

                        <Input
                            label="Unit Cost (₹)"
                            type="number"
                            value={unitCost}
                            onChange={(e) => setUnitCost(e.target.value)}
                            placeholder="Enter unit cost"
                            required
                            min="0"
                            step="0.01"
                        />

                        {quantity && unitCost && (
                            <div className="rounded-lg bg-neutral-50 p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Total Cost:</span>
                                    <span className="font-semibold text-neutral-900">
                                        ₹{(parseInt(quantity) * parseFloat(unitCost)).toFixed(2)}
                                    </span>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="text-neutral-600">New Stock:</span>
                                    <span className="font-semibold text-neutral-900">
                                        {product.currentStock + parseInt(quantity)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={loading} disabled={loading} className="flex-1">
                            Add Stock
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
