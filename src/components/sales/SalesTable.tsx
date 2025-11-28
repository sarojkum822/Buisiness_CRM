'use client';

import React from 'react';
import { Sale } from '@/types';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';

interface SalesTableProps {
    sales: Sale[];
    onViewDetails: (sale: Sale) => void;
}

export function SalesTable({ sales, onViewDetails }: SalesTableProps) {
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getPaymentModeLabel = (mode: string) => {
        const labels: Record<string, string> = {
            cash: 'Cash',
            card: 'Card',
            upi: 'UPI',
            other: 'Other',
        };
        return labels[mode] || mode;
    };

    if (sales.length === 0) {
        return (
            <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
                <div className="mb-2 text-4xl">💰</div>
                <h3 className="mb-1 text-lg font-semibold text-neutral-900">No sales yet</h3>
                <p className="text-sm text-neutral-600">
                    Create your first sale to start tracking revenue and profit.
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
                {sales.map((sale) => (
                    <TableRow key={sale.id}>
                        <TableCell>
                            <span className="font-mono text-xs font-medium text-neutral-900">
                                {sale.invoiceNumber}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span className="text-sm text-neutral-600">
                                {formatDate(sale.createdAt)}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span className="text-sm text-neutral-600">
                                {sale.customerName || '-'}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                            <span className="text-sm font-medium">{sale.items.length}</span>
                        </TableCell>
                        <TableCell className="text-right">
                            <span className="font-medium">₹{sale.grandTotal.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                            <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                                {getPaymentModeLabel(sale.paymentMode)}
                            </span>
                        </TableCell>
                        <TableCell>
                            <div className="flex justify-end">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onViewDetails(sale)}
                                >
                                    View
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
