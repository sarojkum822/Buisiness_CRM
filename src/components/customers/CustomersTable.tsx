'use client';

import React, { useState } from 'react';
import { Customer } from '@/types';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Eye } from 'lucide-react';

interface CustomersTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (customerId: string) => void;
    onView: (customer: Customer) => void;
}

export function CustomersTable({ customers, onEdit, onDelete, onView }: CustomersTableProps) {
    if (customers.length === 0) {
        return (
            <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
                <p className="text-neutral-600">No customers found. Add your first customer!</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500">
                        <tr>
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium">Phone</th>
                            <th className="px-6 py-3 font-medium">Credit Balance</th>
                            <th className="px-6 py-3 font-medium">Total Spent</th>
                            <th className="px-6 py-3 font-medium">Last Visit</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {customers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-neutral-50">
                                <td className="px-6 py-4 font-medium text-neutral-900">
                                    {customer.name}
                                </td>
                                <td className="px-6 py-4 text-neutral-600">
                                    {customer.phone}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`font-medium ${customer.totalCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{customer.totalCredit.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-neutral-600">
                                    ₹{customer.totalSpent.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-neutral-600">
                                    {customer.lastVisit.toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onView(customer)}
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(customer)}
                                            title="Edit"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this customer?')) {
                                                    onDelete(customer.id!);
                                                }
                                            }}
                                            title="Delete"
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
