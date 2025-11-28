'use client';

import React from 'react';
import { Sale } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/auth/AuthContext';

interface SaleDetailsModalProps {
    sale: Sale | null;
    isOpen: boolean;
    onClose: () => void;
}

export function SaleDetailsModal({ sale, isOpen, onClose }: SaleDetailsModalProps) {
    const { orgName } = useAuth();

    if (!sale) return null;

    const profit = sale.grandTotal - sale.totalCost;
    const profitMargin = (profit / sale.grandTotal) * 100;

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sale Details" size="lg">
            <div className="space-y-6">
                {/* Header Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <div className="text-sm text-neutral-600">Invoice Number</div>
                        <div className="font-mono text-lg font-semibold text-neutral-900">
                            {sale.invoiceNumber}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-neutral-600">Date</div>
                        <div className="font-medium text-neutral-900">
                            {formatDate(sale.createdAt)}
                        </div>
                    </div>
                    {sale.customerName && (
                        <div>
                            <div className="text-sm text-neutral-600">Customer</div>
                            <div className="font-medium text-neutral-900">{sale.customerName}</div>
                        </div>
                    )}
                    <div>
                        <div className="text-sm text-neutral-600">Payment Mode</div>
                        <div className="font-medium capitalize text-neutral-900">{sale.paymentMode}</div>
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <h3 className="mb-3 font-semibold text-neutral-900">Items</h3>
                    <div className="overflow-hidden rounded-lg border border-neutral-200">
                        <table className="w-full">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-neutral-600">
                                        Product
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase text-neutral-600">
                                        Qty
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase text-neutral-600">
                                        Price
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase text-neutral-600">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {sale.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm text-neutral-900">
                                            {item.productName}
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm text-neutral-900">
                                            {item.quantity}
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm text-neutral-900">
                                            ₹{item.sellingPrice.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm font-medium text-neutral-900">
                                            ₹{item.lineTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div className="space-y-2 rounded-lg bg-neutral-50 p-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Subtotal:</span>
                        <span className="font-medium">₹{sale.subTotal.toFixed(2)}</span>
                    </div>
                    {sale.discount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">Discount:</span>
                            <span className="font-medium text-red-600">-₹{sale.discount.toFixed(2)}</span>
                        </div>
                    )}
                    {sale.tax > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">Tax:</span>
                            <span className="font-medium">₹{sale.tax.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between border-t border-neutral-200 pt-2 text-lg font-semibold">
                        <span>Grand Total:</span>
                        <span>₹{sale.grandTotal.toFixed(2)}</span>
                    </div>
                </div>

                {/* Profit Info */}
                <div className="rounded-lg border border-neutral-200 p-4">
                    <h3 className="mb-3 font-semibold text-neutral-900">Profit Analysis</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <div className="text-sm text-neutral-600">Total Cost</div>
                            <div className="text-lg font-semibold text-neutral-900">
                                ₹{sale.totalCost.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-neutral-600">Profit</div>
                            <div className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{profit.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-neutral-600">Margin</div>
                            <div className={`text-lg font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {profitMargin.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-neutral-200 pt-4">
                <button
                    onClick={() => {
                        const shopName = orgName ? `*${orgName}*\n` : '';
                        const text = encodeURIComponent(
                            `${shopName}🧾 *Bill Summary - ${sale.invoiceNumber}*\n` +
                            `Date: ${new Date(sale.createdAt).toLocaleDateString()}\n\n` +
                            `*Items:*\n` +
                            sale.items.map(item => `- ${item.productName} x${item.quantity} (₹${item.lineTotal})`).join('\n') +
                            `\n\n` +
                            `*Total: ₹${sale.grandTotal.toFixed(2)}*\n` +
                            `\nThank you for shopping with us! 🙏`
                        );
                        window.open(`https://wa.me/?text=${text}`, '_blank');
                    }}
                    className="flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#128C7E]"
                >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Share Bill on WhatsApp
                </button>
            </div>
        </Modal>
    );
}
