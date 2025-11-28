'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sale, Product } from '@/types';
import { Button } from '@/components/ui/Button';

export default function ReportsPage() {
    const { orgId, orgName } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const getLocalDateString = (date: Date) => {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    };

    const [dateRange, setDateRange] = useState({
        start: getLocalDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
        end: getLocalDateString(new Date()),
    });

    // Fetch sales
    useEffect(() => {
        if (!orgId) return;

        const salesRef = collection(db, 'sales');
        const q = query(salesRef, where('orgId', '==', orgId), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const salesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Sale[];

            setSales(salesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    // Fetch products
    useEffect(() => {
        if (!orgId) return;

        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('orgId', '==', orgId), orderBy('totalRevenue', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as Product[];

            setProducts(productsData);
        });

        return () => unsubscribe();
    }, [orgId]);

    // Quick date range presets
    const setQuickRange = (type: 'today' | 'month' | 'year') => {
        const now = new Date();
        let start: Date;

        switch (type) {
            case 'today':
                start = new Date();
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
        }

        setDateRange({
            start: getLocalDateString(start),
            end: getLocalDateString(new Date()),
        });
    };

    // Print function
    const handlePrint = () => {
        window.print();
    };

    // Filter sales by date range
    const filteredSales = sales.filter((sale) => {
        const saleDate = getLocalDateString(sale.createdAt);
        return saleDate >= dateRange.start && saleDate <= dateRange.end;
    });

    // Calculate metrics
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
    const totalCost = filteredSales.reduce((sum, sale) => sum + sale.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalSales = filteredSales.length;
    const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top products
    const topProducts = products.slice(0, 10);

    // Sales by payment mode
    const salesByPaymentMode = filteredSales.reduce((acc, sale) => {
        acc[sale.paymentMode] = (acc[sale.paymentMode] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-6">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
                    <p className="text-sm text-neutral-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8">
            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          @page {
            margin: 1.5cm;
            size: A4 portrait;
          }
          
          /* Print-specific table styling */
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9pt;
            page-break-inside: auto;
          }
          .print-table thead {
            display: table-header-group;
          }
          .print-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .print-table th {
            background-color: #e0e0e0;
            border: 1px solid #333;
            padding: 6px 4px;
            text-align: left;
            font-weight: bold;
            font-size: 9pt;
          }
          .print-table td {
            border: 1px solid #666;
            padding: 4px;
            font-size: 8.5pt;
          }
          .print-header {
            border-bottom: 3px solid #000;
            margin-bottom: 15px;
            padding-bottom: 8px;
          }
          .print-summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0;
            margin-bottom: 15px;
            border: 2px solid #000;
          }
          .print-summary-item {
            text-align: center;
            padding: 8px;
            border-right: 1px solid #000;
          }
          .print-summary-item:last-child {
            border-right: none;
          }
          .totals-row {
            background-color: #d0d0d0 !important;
            font-weight: bold !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

            {/* Header */}
            <div className="mb-8 flex items-center justify-between no-print">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Reports</h1>
                    <p className="mt-2 text-neutral-600">
                        View analytics and business insights.
                    </p>
                </div>
                <Button onClick={handlePrint}>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Report
                </Button>
            </div>

            {/* Date Range Filter */}
            <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 no-print">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-900">Date Range</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setQuickRange('today')}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setQuickRange('month')}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setQuickRange('year')}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                            This Year
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="mb-2 block text-sm font-medium text-neutral-700">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="mb-2 block text-sm font-medium text-neutral-700">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Printable Report Section - Minimal Data View */}
            <div id="printable-report">
                {/* Print Header - Only visible when printing */}
                <div className="print-only print-header">
                    <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: 0, textAlign: 'center' }}>{orgName}</h1>
                    <p style={{ margin: '3px 0 0 0', fontSize: '11pt', textAlign: 'center', fontWeight: 'bold' }}>SALES REPORT</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '8pt' }}>
                        <span>Period: {new Date(dateRange.start).toLocaleDateString('en-IN')} to {new Date(dateRange.end).toLocaleDateString('en-IN')}</span>
                        <span>Generated: {new Date().toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Summary - Print Only */}
                <div className="print-only" style={{ marginBottom: '15px' }}>
                    <table style={{ width: '100%', border: '2px solid #000', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '6px 10px', border: '1px solid #000', fontWeight: 'bold', width: '25%' }}>Total Sales:</td>
                                <td style={{ padding: '6px 10px', border: '1px solid #000', width: '25%' }}>{totalSales}</td>
                                <td style={{ padding: '6px 10px', border: '1px solid #000', fontWeight: 'bold', width: '25%' }}>Total Revenue:</td>
                                <td style={{ padding: '6px 10px', border: '1px solid #000', width: '25%' }}>₹{totalRevenue.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '6px 10px', border: '1px solid #000', fontWeight: 'bold' }}>Total Cost:</td>
                                <td style={{ padding: '6px 10px', border: '1px solid #000' }}>₹{totalCost.toFixed(2)}</td>
                                <td style={{ padding: '6px 10px', border: '1px solid #000', fontWeight: 'bold' }}>Net Profit:</td>
                                <td style={{ padding: '6px 10px', border: '1px solid #000', fontWeight: 'bold' }}>₹{totalProfit.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Sales Transactions Table - Print Only */}
                <div className="print-only">
                    <h2 style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Sales Transactions</h2>
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th style={{ width: '6%', textAlign: 'center' }}>Date</th>
                                <th style={{ width: '10%' }}>Invoice</th>
                                <th style={{ width: '12%' }}>Customer</th>
                                <th style={{ width: '28%' }}>Items</th>
                                <th style={{ width: '5%', textAlign: 'center' }}>Qty</th>
                                <th style={{ width: '10%', textAlign: 'right' }}>Amount</th>
                                <th style={{ width: '10%', textAlign: 'right' }}>Cost</th>
                                <th style={{ width: '10%', textAlign: 'right' }}>Profit</th>
                                <th style={{ width: '9%', textAlign: 'center' }}>Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map((sale) => {
                                const profit = sale.grandTotal - sale.totalCost;
                                const itemsText = sale.items.map(item => `${item.productName} (${item.quantity})`).join(', ');
                                const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);

                                return (
                                    <tr key={sale.id}>
                                        <td style={{ textAlign: 'center' }}>{sale.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })}</td>
                                        <td style={{ fontSize: '7.5pt' }}>{sale.invoiceNumber}</td>
                                        <td>{sale.customerName || '-'}</td>
                                        <td style={{ fontSize: '7.5pt' }}>{itemsText}</td>
                                        <td style={{ textAlign: 'center' }}>{totalQty}</td>
                                        <td style={{ textAlign: 'right' }}>₹{sale.grandTotal.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>₹{sale.totalCost.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{profit.toFixed(2)}</td>
                                        <td style={{ textAlign: 'center', textTransform: 'capitalize', fontSize: '8pt' }}>{sale.paymentMode}</td>
                                    </tr>
                                );
                            })}
                            {/* Totals Row */}
                            <tr className="totals-row">
                                <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTAL:</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{totalRevenue.toFixed(2)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{totalCost.toFixed(2)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{totalProfit.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Payment Mode Breakdown - Print Only */}
                {Object.keys(salesByPaymentMode).length > 0 && (
                    <div className="print-only" style={{ marginTop: '15px' }}>
                        <h2 style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Payment Mode Breakdown</h2>
                        <table className="print-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Payment Mode</th>
                                    <th style={{ textAlign: 'center', width: '20%' }}>Count</th>
                                    <th style={{ textAlign: 'right', width: '20%' }}>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(salesByPaymentMode).map(([mode, count]) => (
                                    <tr key={mode}>
                                        <td style={{ textTransform: 'capitalize' }}>{mode}</td>
                                        <td style={{ textAlign: 'center' }}>{count}</td>
                                        <td style={{ textAlign: 'right' }}>{((count / totalSales) * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Screen View - Summary Cards */}
                <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 no-print">
                    <div className="rounded-lg border border-neutral-200 bg-white p-6">
                        <div className="mb-2 text-sm text-neutral-600">Total Revenue</div>
                        <div className="text-2xl font-bold text-neutral-900">₹{totalRevenue.toFixed(2)}</div>
                        <div className="mt-1 text-xs text-neutral-500">{totalSales} sales</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-6">
                        <div className="mb-2 text-sm text-neutral-600">Total Profit</div>
                        <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{totalProfit.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                            {totalProfit >= 0 ? '+' : ''}{((totalProfit / totalRevenue) * 100 || 0).toFixed(1)}% margin
                        </div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-6">
                        <div className="mb-2 text-sm text-neutral-600">Average Sale</div>
                        <div className="text-2xl font-bold text-neutral-900">₹{averageSaleValue.toFixed(2)}</div>
                        <div className="mt-1 text-xs text-neutral-500">Per transaction</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-6">
                        <div className="mb-2 text-sm text-neutral-600">Total Cost</div>
                        <div className="text-2xl font-bold text-neutral-900">₹{totalCost.toFixed(2)}</div>
                        <div className="mt-1 text-xs text-neutral-500">Cost of goods sold</div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-neutral-900">Top 10 Products by Revenue</h2>
                    {topProducts.length === 0 ? (
                        <p className="py-8 text-center text-sm text-neutral-600">No products yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-200">
                                        <th className="pb-3 text-left text-sm font-medium text-neutral-600">Rank</th>
                                        <th className="pb-3 text-left text-sm font-medium text-neutral-600">Product</th>
                                        <th className="pb-3 text-right text-sm font-medium text-neutral-600">Units Sold</th>
                                        <th className="pb-3 text-right text-sm font-medium text-neutral-600">Revenue</th>
                                        <th className="pb-3 text-right text-sm font-medium text-neutral-600">Avg Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((product, index) => {
                                        const avgPrice = product.totalSoldQty > 0 ? product.totalRevenue / product.totalSoldQty : 0;
                                        return (
                                            <tr key={product.id} className="border-b border-neutral-100">
                                                <td className="py-3 text-sm text-neutral-900">#{index + 1}</td>
                                                <td className="py-3 text-sm font-medium text-neutral-900">{product.name}</td>
                                                <td className="py-3 text-right text-sm text-neutral-900">{product.totalSoldQty}</td>
                                                <td className="py-3 text-right text-sm text-neutral-900">₹{product.totalRevenue.toFixed(2)}</td>
                                                <td className="py-3 text-right text-sm text-neutral-900">₹{avgPrice.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Sales by Payment Mode */}
                <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 no-print">
                    <h2 className="mb-4 text-lg font-semibold text-neutral-900">Sales by Payment Mode</h2>
                    {Object.keys(salesByPaymentMode).length === 0 ? (
                        <p className="py-8 text-center text-sm text-neutral-600">No sales yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-200">
                                        <th className="pb-3 text-left text-sm font-medium text-neutral-600">Payment Mode</th>
                                        <th className="pb-3 text-right text-sm font-medium text-neutral-600">Count</th>
                                        <th className="pb-3 text-right text-sm font-medium text-neutral-600">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(salesByPaymentMode).map(([mode, count]) => (
                                        <tr key={mode} className="border-b border-neutral-100">
                                            <td className="py-3 text-sm capitalize text-neutral-900">{mode}</td>
                                            <td className="py-3 text-right text-sm font-semibold text-neutral-900">{count}</td>
                                            <td className="py-3 text-right text-sm text-neutral-600">
                                                {((count / totalSales) * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Sales */}
                <div className="rounded-lg border border-neutral-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-neutral-900">Recent Sales (Last 20)</h2>
                    {filteredSales.length === 0 ? (
                        <p className="py-8 text-center text-sm text-neutral-600">No sales in this date range</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide">
                                        <th className="pb-3 text-left font-semibold text-neutral-600">Invoice</th>
                                        <th className="pb-3 text-left font-semibold text-neutral-600">Date</th>
                                        <th className="pb-3 text-left font-semibold text-neutral-600">Customer</th>
                                        <th className="pb-3 text-center font-semibold text-neutral-600">Items</th>
                                        <th className="pb-3 text-right font-semibold text-neutral-600">Amount</th>
                                        <th className="pb-3 text-right font-semibold text-neutral-600">Profit</th>
                                        <th className="pb-3 text-center font-semibold text-neutral-600">Payment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {filteredSales.slice(0, 20).map((sale) => {
                                        const profit = sale.grandTotal - sale.totalCost;
                                        return (
                                            <tr key={sale.id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="py-3 font-mono text-xs text-neutral-700">{sale.invoiceNumber}</td>
                                                <td className="py-3 text-sm text-neutral-700 whitespace-nowrap">
                                                    {sale.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="py-3 text-sm text-neutral-900 font-medium">{sale.customerName || '-'}</td>
                                                <td className="py-3 text-center">
                                                    <span className="inline-flex items-center justify-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                                                        {sale.items.length}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right text-sm font-semibold text-neutral-900">₹{sale.grandTotal.toFixed(2)}</td>
                                                <td className="py-3 text-right">
                                                    <span className={`inline-block text-sm font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {profit >= 0 ? '+' : ''}₹{profit.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                                                        {sale.paymentMode}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div> {/* End printable-report */}
        </div>
    );
}
