'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Customer } from '@/types';

interface CustomerFormProps {
    initialData?: Partial<Customer>;
    onSubmit: (data: Partial<Customer>) => Promise<void>;
    onCancel: () => void;
}

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        address: initialData?.address || '',
    });

    // Separate state for balance logic to handle 0 amount correctly
    const [amount, setAmount] = useState(Math.abs(initialData?.totalCredit || 0));
    const [balanceType, setBalanceType] = useState<'collect' | 'pay'>(
        (initialData?.totalCredit || 0) < 0 ? 'pay' : 'collect'
    );

    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        if (!formData.phone.trim()) {
            setError('Phone is required');
            return;
        }

        setLoading(true);
        try {
            // Calculate final totalCredit based on type and amount
            const finalCredit = balanceType === 'pay' ? -Math.abs(amount) : Math.abs(amount);

            await onSubmit({
                ...formData,
                totalCredit: finalCredit
            });
        } catch (err: any) {
            console.error('Error saving customer:', err);
            setError(err.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
            />

            <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                disabled={loading}
            />

            <Input
                label="Email (Optional)"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
            />

            <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Address (Optional)</label>
                <textarea
                    className="w-full rounded-md border border-neutral-300 p-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={loading}
                />
            </div>

            {/* Balance Section - Available for both Add and Edit */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <label className="mb-2 block text-sm font-medium text-neutral-900">
                    {initialData ? 'Current Balance' : 'Opening Balance'}
                </label>

                <div className="mb-3 flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            type="radio"
                            name="balanceType"
                            checked={balanceType === 'collect'}
                            onChange={() => setBalanceType('collect')}
                            className="h-4 w-4 text-red-600 focus:ring-red-600"
                            disabled={loading}
                        />
                        <span className="text-sm font-medium text-red-700">
                            Customer Owes Me (Udhaar) - To Collect
                        </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            type="radio"
                            name="balanceType"
                            checked={balanceType === 'pay'}
                            onChange={() => setBalanceType('pay')}
                            className="h-4 w-4 text-green-600 focus:ring-green-600"
                            disabled={loading}
                        />
                        <span className="text-sm font-medium text-green-700">
                            I Owe Customer (Advance) - To Pay
                        </span>
                    </label>
                </div>

                <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    disabled={loading}
                    placeholder="0.00"
                />
                <p className="mt-1 text-xs text-neutral-500">
                    {balanceType === 'collect'
                        ? "Positive value means customer has to pay you."
                        : "Negative value means you have advance money from customer."}
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={loading}>
                    {initialData ? 'Update Customer' : 'Add Customer'}
                </Button>
            </div>
        </form>
    );
}
