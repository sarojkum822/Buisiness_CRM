'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Customer } from '@/types';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/lib/firestore/customers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { CustomersTable } from '@/components/customers/CustomersTable';
import { CustomerDetailsModal } from '@/components/customers/CustomerDetailsModal';
import { Plus, Search } from 'lucide-react';

export default function CustomersPage() {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Fetch customers
    const fetchCustomers = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const data = await getCustomers(user.email);
            // Client-side sorting
            data.sort((a, b) => a.name.localeCompare(b.name));
            setCustomers(data);
            setFilteredCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [user?.email]);

    // Filter customers
    useEffect(() => {
        if (!searchTerm) {
            setFilteredCustomers(customers);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = customers.filter(
                (c) =>
                    c.name.toLowerCase().includes(lowerTerm) ||
                    c.phone.includes(lowerTerm)
            );
            setFilteredCustomers(filtered);
        }
    }, [searchTerm, customers]);

    const handleCreateCustomer = async (data: Partial<Customer>) => {
        if (!user?.email) return;
        await createCustomer(user.email, data);
        setShowAddModal(false);
        fetchCustomers();
    };

    const handleUpdateCustomer = async (data: Partial<Customer>) => {
        if (!selectedCustomer) return;
        await updateCustomer(selectedCustomer.id!, data);
        setShowEditModal(false);
        fetchCustomers();
    };

    const handleDeleteCustomer = async (customerId: string) => {
        await deleteCustomer(customerId);
        fetchCustomers();
    };

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Customers</h1>
                    <p className="mt-2 text-neutral-600">
                        Manage your customers and track their credit.
                    </p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>

            {/* Search */}
            <div className="mb-6 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex min-h-[200px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
                </div>
            ) : (
                <CustomersTable
                    customers={filteredCustomers}
                    onEdit={(customer) => {
                        setSelectedCustomer(customer);
                        setShowEditModal(true);
                    }}
                    onDelete={handleDeleteCustomer}
                    onView={(customer) => {
                        setSelectedCustomer(customer);
                        setShowDetailsModal(true);
                    }}
                />
            )}

            {/* Add Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add New Customer"
            >
                <CustomerForm
                    onSubmit={handleCreateCustomer}
                    onCancel={() => setShowAddModal(false)}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Customer"
            >
                <CustomerForm
                    initialData={selectedCustomer || undefined}
                    onSubmit={handleUpdateCustomer}
                    onCancel={() => setShowEditModal(false)}
                />
            </Modal>

            {/* Details Modal */}
            <CustomerDetailsModal
                customer={selectedCustomer}
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    fetchCustomers(); // Refresh in case payment was made
                }}
            />
        </div>
    );
}
