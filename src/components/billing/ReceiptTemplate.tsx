import { Sale } from '@/types';

interface ReceiptTemplateProps {
    sale: any; // Using any for now to include extra fields like customerName easily
    orgName: string;
}

export function ReceiptTemplate({ sale, orgName }: ReceiptTemplateProps) {
    if (!sale) return null;

    return (
        <div className="receipt-container hidden print:block print:w-full print:h-screen bg-white text-black font-sans">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 20mm;
                        size: auto;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .receipt-container, .receipt-container * {
                        visibility: visible;
                    }
                    .receipt-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 9999;
                        background-color: white;
                        display: block !important;
                    }
                }
            `}</style>

            {/* Header Section */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-neutral-800 pb-6">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-tight mb-2">{orgName}</h1>
                    <p className="text-sm text-neutral-600">Business Address Line 1</p>
                    <p className="text-sm text-neutral-600">City, State, Zip Code</p>
                    <p className="text-sm text-neutral-600">Phone: +91 98765 43210</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-neutral-400 uppercase mb-2">Invoice</h2>
                    <p className="text-lg font-mono font-semibold">#{sale.invoiceNumber}</p>
                    <p className="text-sm text-neutral-500 mt-1">
                        Date: {new Date(sale.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-neutral-500">
                        Time: {new Date(sale.createdAt).toLocaleTimeString()}
                    </p>
                </div>
            </div>

            {/* Customer & Bill To Section */}
            <div className="mb-8 flex justify-between">
                <div className="w-1/2">
                    <h3 className="text-xs font-bold uppercase text-neutral-500 mb-2">Bill To</h3>
                    {sale.customerName ? (
                        <div>
                            <p className="font-semibold text-lg">{sale.customerName}</p>
                            {/* Placeholder for customer address/phone if available */}
                            <p className="text-sm text-neutral-600">Customer ID: {sale.customerId || 'N/A'}</p>
                        </div>
                    ) : (
                        <p className="text-neutral-500 italic">Walk-in Customer</p>
                    )}
                </div>
                <div className="w-1/2 text-right">
                    <h3 className="text-xs font-bold uppercase text-neutral-500 mb-2">Payment Details</h3>
                    <p className="font-semibold capitalize">Mode: {sale.paymentMode}</p>
                    <p className="text-sm text-neutral-600">Status: Paid</p>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-neutral-800">
                            <th className="py-3 text-sm font-bold uppercase text-neutral-600 w-1/12">#</th>
                            <th className="py-3 text-sm font-bold uppercase text-neutral-600 w-5/12">Item Description</th>
                            <th className="py-3 text-sm font-bold uppercase text-neutral-600 text-right w-2/12">Price</th>
                            <th className="py-3 text-sm font-bold uppercase text-neutral-600 text-right w-2/12">Qty</th>
                            <th className="py-3 text-sm font-bold uppercase text-neutral-600 text-right w-2/12">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item: any, index: number) => (
                            <tr key={index} className="border-b border-neutral-200">
                                <td className="py-4 text-sm text-neutral-500">{index + 1}</td>
                                <td className="py-4 text-sm font-medium">{item.productName}</td>
                                <td className="py-4 text-sm text-right">₹{item.sellingPrice.toFixed(2)}</td>
                                <td className="py-4 text-sm text-right">{item.quantity}</td>
                                <td className="py-4 text-sm font-bold text-right">₹{item.lineTotal.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-12">
                <div className="w-1/3 space-y-3">
                    <div className="flex justify-between text-sm text-neutral-600">
                        <span>Subtotal</span>
                        <span>₹{sale.subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-600">
                        <span>Tax (0%)</span>
                        <span>₹0.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-600">
                        <span>Discount</span>
                        <span>-₹{sale.discount.toFixed(2)}</span>
                    </div>
                    <div className="border-t-2 border-neutral-800 pt-3 flex justify-between text-xl font-bold">
                        <span>Grand Total</span>
                        <span>₹{sale.grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-200 pt-8 text-center">
                <p className="font-bold text-lg mb-2">Thank you for your business!</p>
                <p className="text-sm text-neutral-500">
                    For any queries, please contact us at support@myshop.com or call +91 98765 43210.
                </p>
                <p className="text-xs text-neutral-400 mt-4">
                    Generated via ShopCRM
                </p>
            </div>
        </div>
    );
}
