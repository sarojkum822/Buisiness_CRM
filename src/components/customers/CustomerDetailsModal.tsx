import React, { useState, useEffect } from 'react';
import { Customer, CustomerTransaction } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { recordCustomerPayment } from '@/lib/firestore/customers';
import { getCustomerTransactions } from '@/lib/firestore/transactions';
import { useAuth } from '@/lib/auth/AuthContext';

interface CustomerDetailsModalProps {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
}

export function CustomerDetailsModal({ customer, isOpen, onClose }: CustomerDetailsModalProps) {
    const { orgName } = useAuth();
    const [settleAmount, setSettleAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSettleInput, setShowSettleInput] = useState(false);
    const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (customer && isOpen) {
            loadHistory();
        }
    }, [customer, isOpen]);

    const loadHistory = async () => {
        if (!customer) return;
        setLoadingHistory(true);
        try {
            const data = await getCustomerTransactions(customer.id!);
            setTransactions(data);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    if (!customer) return null;

    const handleSettleCredit = async () => {
        if (!settleAmount || parseFloat(settleAmount) <= 0) return;

        setLoading(true);
        try {
            await recordCustomerPayment(customer.id!, parseFloat(settleAmount));
            setSettleAmount('');
            setShowSettleInput(false);
            loadHistory(); // Refresh history
            // Note: Parent component needs to refresh customer data to update balance
        } catch (error: any) {
            console.error('Error settling credit:', error);
            alert(`Failed to record payment: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customer Details" size="lg">
            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-neutral-900">{customer.name}</h3>
                        <p className="text-neutral-600">{customer.phone}</p>
                        {customer.email && <p className="text-sm text-neutral-500">{customer.email}</p>}
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-neutral-600">Current Balance</div>
                        <div className={`text-2xl font-bold ${customer.totalCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {customer.totalCredit > 0 ? 'To Collect: ' : customer.totalCredit < 0 ? 'To Pay: ' : ''}
                            ₹{Math.abs(customer.totalCredit).toFixed(2)}
                        </div>
                        {customer.totalCredit !== 0 && (
                            <button
                                onClick={() => {
                                    const isToCollect = customer.totalCredit > 0;
                                    const amount = Math.abs(customer.totalCredit).toFixed(2);
                                    const shopPrefix = orgName ? `*${orgName}*: ` : '';
                                    let message = '';

                                    if (isToCollect) {
                                        message = `${shopPrefix}Hello ${customer.name}, a gentle reminder that your pending balance with us is ₹${amount}. Please pay at your earliest convenience. 🙏`;
                                    } else {
                                        message = `${shopPrefix}Hello ${customer.name}, just to update you that your advance balance with us is ₹${amount}.`;
                                    }

                                    const url = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                                    window.open(url, '_blank');
                                }}
                                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#25D366] hover:text-[#128C7E]"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Share on WhatsApp
                            </button>
                        )}
                    </div>
                </div>

                {/* Address */}
                {customer.address && (
                    <div className="rounded-lg bg-neutral-50 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Address</div>
                        <p className="mt-1 text-sm text-neutral-900">{customer.address}</p>
                    </div>
                )}

                {/* Credit Settlement */}
                <div className="flex gap-2">
                    {!showSettleInput ? (
                        <Button
                            onClick={() => setShowSettleInput(true)}
                            className="bg-neutral-900 hover:bg-neutral-800"
                        >
                            Record Payment / Settle Balance
                        </Button>
                    ) : (
                        <div className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                            <Input
                                type="number"
                                placeholder="Amount"
                                value={settleAmount}
                                onChange={(e) => setSettleAmount(e.target.value)}
                                disabled={loading}
                                className="w-40"
                            />
                            <Button
                                onClick={handleSettleCredit}
                                isLoading={loading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Save Payment
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowSettleInput(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>

                {/* Transaction History */}
                <div>
                    <h4 className="mb-3 font-semibold text-neutral-900">Transaction History</h4>
                    <div className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 text-neutral-500 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Date</th>
                                    <th className="px-4 py-2 font-medium">Description</th>
                                    <th className="px-4 py-2 font-medium text-right">Amount</th>
                                    <th className="px-4 py-2 font-medium text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {loadingHistory ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-neutral-500">Loading history...</td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-neutral-500">No transactions found</td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="px-4 py-2 text-neutral-600">
                                                {tx.date.toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tx.type === 'SALE' ? 'bg-red-100 text-red-800' :
                                                    tx.type === 'PAYMENT' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {tx.type === 'SALE' ? 'Sale' : tx.type === 'PAYMENT' ? 'Payment' : 'Opening'}
                                                </span>
                                                <span className="ml-2 text-neutral-900">{tx.description}</span>
                                            </td>
                                            <td className={`px-4 py-2 text-right font-medium ${tx.type === 'SALE' ? 'text-red-600' : 'text-green-600'
                                                }`}>
                                                {tx.type === 'SALE' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-right text-neutral-600">
                                                ₹{tx.balanceAfter.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
