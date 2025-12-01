import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Customer } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { recordCustomerPayment } from '@/lib/firestore/customers';

interface PaymentModalProps {
    customer: Customer;
    onClose: () => void;
    onSuccess: () => void;
}

export function PaymentModal({ customer, onClose, onSuccess }: PaymentModalProps) {
    const [amount, setAmount] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!amount || Number(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            await recordCustomerPayment(customer.id!, Number(amount));
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Payment failed", err);
            setError(err.message || 'Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="flex items-center justify-between border-b border-neutral-100 p-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Receive Payment</h3>
                    <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 rounded-lg bg-blue-50 p-4">
                        <p className="text-sm text-blue-600 mb-1">Current Balance for</p>
                        <p className="font-medium text-blue-900 text-lg">{customer.name}</p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-blue-700">
                                ₹{customer.totalCredit?.toFixed(2) || '0.00'}
                            </span>
                            <span className="text-sm text-blue-600">outstanding</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Payment Amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                            required
                            placeholder="Enter amount received"
                            autoFocus
                        />

                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={loading} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirm Payment
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
