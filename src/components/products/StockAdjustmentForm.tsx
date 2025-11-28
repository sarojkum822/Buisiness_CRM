'use client';

import React, { useState } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface StockAdjustmentFormProps {
    productName: string;
    currentStock: number;
    onSubmit: (data: {
        type: 'IN' | 'OUT' | 'ADJUSTMENT';
        quantity: number;
        unitCost: number;
        reason: string;
    }) => Promise<void>;
    onCancel: () => void;
}

export function StockAdjustmentForm({
    productName,
    currentStock,
    onSubmit,
    onCancel,
}: StockAdjustmentFormProps) {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
        quantity: '',
        unitCost: '',
        reason: '',
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.quantity || parseInt(formData.quantity) <= 0) {
            newErrors.quantity = 'Quantity must be greater than 0';
        }

        if (formData.type === 'OUT') {
            const qty = parseInt(formData.quantity);
            if (qty > currentStock) {
                newErrors.quantity = `Cannot remove more than current stock (${currentStock})`;
            }
        }

        if (formData.type === 'IN' && (!formData.unitCost || parseFloat(formData.unitCost) < 0)) {
            newErrors.unitCost = 'Unit cost is required for stock IN';
        }

        if (!formData.reason.trim()) {
            newErrors.reason = 'Reason is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                type: formData.type,
                quantity: parseInt(formData.quantity),
                unitCost: formData.unitCost ? parseFloat(formData.unitCost) : 0,
                reason: formData.reason.trim(),
            });
        } catch (error) {
            console.error('Error adjusting stock:', error);
            setErrors({ submit: 'Failed to adjust stock. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const getNewStock = () => {
        const qty = parseInt(formData.quantity) || 0;
        if (formData.type === 'IN') return currentStock + qty;
        if (formData.type === 'OUT') return currentStock - qty;
        return qty; // ADJUSTMENT sets to exact value
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-neutral-50 p-4">
                <div className="mb-2 text-sm font-medium text-neutral-700">Product</div>
                <div className="text-lg font-semibold text-neutral-900">{productName}</div>
                <div className="mt-1 text-sm text-neutral-600">
                    Current Stock: <span className="font-medium">{currentStock}</span>
                </div>
            </div>

            <Select
                label="Adjustment Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
                disabled={loading}
            >
                <option value="IN">Stock IN (Add)</option>
                <option value="OUT">Stock OUT (Remove)</option>
                <option value="ADJUSTMENT">Adjustment (Set Exact)</option>
            </Select>

            <Input
                label={formData.type === 'ADJUSTMENT' ? 'New Stock Quantity' : 'Quantity'}
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                error={errors.quantity}
                helperText={
                    formData.quantity
                        ? `New stock will be: ${getNewStock()}`
                        : undefined
                }
                required
                disabled={loading}
            />

            {formData.type === 'IN' && (
                <Input
                    label="Unit Cost (₹)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    error={errors.unitCost}
                    helperText="Cost per unit for this stock addition"
                    required
                    disabled={loading}
                />
            )}

            <Input
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                error={errors.reason}
                helperText="e.g., 'New purchase', 'Damaged goods', 'Inventory count'"
                required
                disabled={loading}
            />

            {errors.submit && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {errors.submit}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={loading}>
                    Adjust Stock
                </Button>
            </div>
        </form>
    );
}
