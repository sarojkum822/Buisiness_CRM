'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sale } from '@/types';
import { recordSale } from '@/lib/firestore/sales';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SaleForm } from '@/components/sales/SaleForm';
import { SalesTable } from '@/components/sales/SalesTable';
import { SaleDetailsModal } from '@/components/sales/SaleDetailsModal';

export default function SalesPage() {
    const { orgId } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Modal states
    const [showNewSaleModal, setShowNewSaleModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // Real-time sales listener
    useEffect(() => {
        if (!orgId) return;

        const salesRef = collection(db, 'sales');
        const q = query(salesRef, where('orgId', '==', orgId), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const salesData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                })) as Sale[];

                setSales(salesData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching sales:", error);
                setLoading(false);
                // Optional: Set an error state to show in UI
            }
        );

        return () => unsubscribe();
    }, [orgId]);

    // Filter sales based on date range
    useEffect(() => {
        let filtered = sales;

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            filtered = filtered.filter((s) => s.createdAt >= start);
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter((s) => s.createdAt <= end);
        }

        setFilteredSales(filtered);
    }, [sales, startDate, endDate]);

    const handleCreateSale = async (saleData: any) => {
        if (!orgId) return;
        await recordSale(orgId, saleData);
        setShowNewSaleModal(false);
    };

    const handleViewDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setShowDetailsModal(true);
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-6">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
                    <p className="text-sm text-neutral-600">Loading sales...</p>
                </div>
            </div>
        );
    }

    // Calculate summary stats
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.grandTotal - sale.totalCost), 0);
    const totalSales = filteredSales.length;

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Sales</h1>
                <p className="mt-2 text-neutral-600">
                    Record sales and track revenue.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="text-sm text-neutral-600">Total Sales</div>
                    <div className="mt-1 text-2xl font-bold text-neutral-900">{totalSales}</div>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="text-sm text-neutral-600">Total Revenue</div>
                    <div className="mt-1 text-2xl font-bold text-neutral-900">
                        ₹{totalRevenue.toFixed(2)}
                    </div>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="text-sm text-neutral-600">Total Profit</div>
                    <div className={`mt-1 text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{totalProfit.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-1 gap-4">
                    <div className="w-40">
                        <Input
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="w-40">
                        <Input
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    {(startDate || endDate) && (
                        <div className="flex items-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    )}
                </div>
                <Button onClick={() => setShowNewSaleModal(true)}>
                    + New Sale
                </Button>
            </div>

            {/* Sales Table */}
            <SalesTable sales={filteredSales} onViewDetails={handleViewDetails} />

            {/* New Sale Modal */}
            <Modal
                isOpen={showNewSaleModal}
                onClose={() => setShowNewSaleModal(false)}
                title="New Sale"
                size="xl"
            >
                <SaleForm
                    onSubmit={handleCreateSale}
                    onCancel={() => setShowNewSaleModal(false)}
                />
            </Modal>

            {/* Sale Details Modal */}
            <SaleDetailsModal
                sale={selectedSale}
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedSale(null);
                }}
            />
        </div>
    );
}
