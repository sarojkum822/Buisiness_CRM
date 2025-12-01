import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, ArrowLeft } from 'lucide-react';
import { Customer } from '@/types';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { createCustomer } from '@/lib/firestore/customers';

interface CustomerSelectionModalProps {
    customers: Customer[];
    onSelect: (customer: Customer) => void;
    onClose: () => void;
    orgId: string;
}

export function CustomerSelectionModal({ customers, onSelect, onClose, orgId }: CustomerSelectionModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        setFilteredCustomers(
            customers.filter(c =>
                c.name.toLowerCase().includes(lowerTerm) ||
                c.phone.includes(lowerTerm)
            )
        );
    }, [searchTerm, customers]);

    const handleAddCustomer = async (data: Partial<Customer>) => {
        try {
            const newId = await createCustomer(orgId, data);
            const newCustomer = {
                id: newId,
                orgId,
                ...data,
                totalCredit: data.totalCredit || 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastVisit: new Date(),
                totalVisits: 0,
                totalSpent: 0
            } as Customer;

            onSelect(newCustomer);
        } catch (error) {
            console.error("Failed to create customer", error);
            alert("Failed to create customer. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-neutral-100 p-4 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        {isAdding && (
                            <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-neutral-100 rounded-full">
                                <ArrowLeft className="h-5 w-5 text-neutral-600" />
                            </button>
                        )}
                        <h3 className="text-lg font-semibold text-neutral-900">
                            {isAdding ? 'Add New Customer' : 'Select Customer'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4">
                    {isAdding ? (
                        <CustomerForm
                            onSubmit={handleAddCustomer}
                            onCancel={() => setIsAdding(false)}
                        />
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-lg border border-neutral-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="flex items-center gap-2 bg-neutral-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Add New</span>
                                </button>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-1">
                                {filteredCustomers.length === 0 ? (
                                    <div className="py-8 text-center text-neutral-500">
                                        <p>No customers found.</p>
                                        <button
                                            onClick={() => setIsAdding(true)}
                                            className="mt-2 text-blue-600 hover:underline text-sm"
                                        >
                                            Add "{searchTerm}" as new customer
                                        </button>
                                    </div>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <button
                                            key={customer.id}
                                            onClick={() => onSelect(customer)}
                                            className="w-full flex items-center justify-between rounded-lg p-3 text-left hover:bg-neutral-50 transition-colors group"
                                        >
                                            <div>
                                                <p className="font-medium text-neutral-900 group-hover:text-blue-600">{customer.name}</p>
                                                <p className="text-xs text-neutral-500">{customer.phone}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-neutral-600">Credit Balance</p>
                                                <p className="text-sm font-bold text-neutral-900">₹{customer.totalCredit?.toFixed(2) || '0.00'}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
