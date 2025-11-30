'use client';

import { Sale } from '@/types';
import { Button } from '@/components/ui/Button';
import { Printer, X, CheckCircle } from 'lucide-react';

interface BillSuccessModalProps {
    sale: Sale;
    onPrint: () => void;
    onClose: () => void;
}

export function BillSuccessModal({ sale, onPrint, onClose }: BillSuccessModalProps) {
    return (
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
                <div className="flex gap-3 bg-neutral-50 p-6">
                    <Button onClick={onClose} variant="outline" className="flex-1 border-neutral-300">
                        <X className="mr-2 h-4 w-4" />
                        Close & New Sale
                    </Button>
                    <Button onClick={onPrint} className="flex-1 bg-neutral-900 hover:bg-neutral-800">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Bill
                    </Button>
                </div>
            </div>
        </div>
    );
}
