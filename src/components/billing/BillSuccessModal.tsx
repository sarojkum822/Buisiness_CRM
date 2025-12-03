'use client';

import { useState } from 'react';
import { Sale } from '@/types';
import { Button } from '@/components/ui/Button';
import { Printer, X, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';

interface BillSuccessModalProps {
    sale: Sale;
    onPrint: () => void;
    onClose: () => void;
}

export function BillSuccessModal({ sale, onPrint, onClose }: BillSuccessModalProps) {
    const { isPro, orgName } = useAuth();
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

    const handleWhatsAppShare = () => {
        if (!isPro) {
            setIsSubscriptionModalOpen(true);
            return;
        }

        // Construct WhatsApp Message
        const itemsList = sale.items
            .map(item => `• ${item.productName} x ${item.quantity} = ₹${item.lineTotal}`)
            .join('\n');

        const message = `*Invoice #${sale.invoiceNumber}*\n` +
            `From: ${orgName || 'StoreMate'}\n\n` +
            `*Items:*\n${itemsList}\n\n` +
            `*Total Amount: ₹${sale.grandTotal.toFixed(2)}*\n\n` +
            `Thank you for shopping with us!`;

        const encodedMessage = encodeURIComponent(message);

        if (sale.customerPhone) {
            // Remove any non-digit characters from phone number for the URL
            const cleanPhone = sale.customerPhone.replace(/\D/g, '');
            // Ensure country code (assuming 91 for India if missing, or just use as is)
            const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

            window.open(`https://wa.me/${phoneWithCode}?text=${encodedMessage}`, '_blank');
        } else {
            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        }
    };

    return (
        <>
            <SubscriptionModal
                isOpen={isSubscriptionModalOpen}
                onClose={() => setIsSubscriptionModalOpen(false)}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    {/* Header */}
                    <div className="bg-green-600 p-6 text-center text-white">
                        <div className="mb-2 flex justify-center">
                            <CheckCircle className="h-12 w-12" />
                        </div>
                        <h2 className="text-2xl font-bold">Sale Successful!</h2>
                        <p className="text-green-100">Invoice #{sale.invoiceNumber}</p>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="mb-3 font-semibold text-neutral-900">Items Purchased</h3>
                            <div className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200">
                                <table className="min-w-full divide-y divide-neutral-200">
                                    <thead className="bg-neutral-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Item</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase">Qty</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 bg-white">
                                        {sale.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-sm text-neutral-900">{item.productName}</td>
                                                <td className="px-4 py-2 text-right text-sm text-neutral-600">{item.quantity}</td>
                                                <td className="px-4 py-2 text-right text-sm font-medium text-neutral-900">
                                                    ₹{item.lineTotal.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-between border-t border-neutral-100 pt-4 text-lg font-bold text-neutral-900">
                            <span>Total Amount</span>
                            <span>₹{sale.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-3 bg-neutral-50 p-6">
                        <Button
                            onClick={handleWhatsAppShare}
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                        >
                            <Smartphone className="mr-2 h-4 w-4" />
                            Share on WhatsApp {isPro ? '' : '(Pro)'}
                        </Button>

                        <div className="flex gap-3">
                            <Button onClick={onClose} variant="outline" className="flex-1 border-neutral-300">
                                <X className="mr-2 h-4 w-4" />
                                Close
                            </Button>
                            <Button onClick={onPrint} className="flex-1 bg-neutral-900 hover:bg-neutral-800">
                                <Printer className="mr-2 h-4 w-4" />
                                Print Bill
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
