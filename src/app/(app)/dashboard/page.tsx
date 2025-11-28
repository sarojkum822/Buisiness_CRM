'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDocs, onSnapshot, query, orderBy, limit, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product, Sale, DailyStats, Customer } from '@/types';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { ProductPerformanceChart } from '@/components/dashboard/ProductPerformanceChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { DeadStockList } from '@/components/dashboard/DeadStockList';

export default function DashboardPage() {
    const { orgId } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<{ revenue: number; profit: number; sales: number }>({ revenue: 0, profit: 0, sales: 0 });
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

    // Real-time customers listener for Udhaar calculation
    useEffect(() => {
        if (!orgId) return;

        const customersRef = collection(db, 'customers');
        const q = query(customersRef, where('orgId', '==', orgId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const customersData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Customer[];

            setCustomers(customersData);
        });

        return () => unsubscribe();
    }, [orgId]);

    // Real-time products listener
    useEffect(() => {
        if (!orgId) return;

        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('orgId', '==', orgId), orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as Product[];

            setProducts(productsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    // Real-time sales listener (last 5 for display)
    useEffect(() => {
        if (!orgId) return;

        const salesRef = collection(db, 'sales');
        const q = query(salesRef, where('orgId', '==', orgId), orderBy('createdAt', 'desc'), limit(5));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const salesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            })) as Sale[];

            setSales(salesData);
        });

        return () => unsubscribe();
    }, [orgId]);

    // Real-time all sales listener for monthly calculation
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

            setAllSales(salesData);
        });

        return () => unsubscribe();
    }, [orgId]);

    // Real-time today's stats listener
    useEffect(() => {
        if (!orgId) return;

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const statsRef = doc(db, 'dailyStats', `${orgId}_${dateStr}`);

        const unsubscribe = onSnapshot(statsRef, (snapshot) => {
            if (snapshot.exists()) {
                setTodayStats({
                    id: snapshot.id,
                    ...snapshot.data(),
                    createdAt: snapshot.data().createdAt?.toDate() || new Date(),
                } as DailyStats);
            } else {
                setTodayStats(null);
            }
        });

        return () => unsubscribe();
    }, [orgId]);

    // Calculate monthly stats
    useEffect(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlySales = allSales.filter(sale => sale.createdAt >= firstDayOfMonth);

        const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + sale.grandTotal, 0);
        const monthlyProfit = monthlySales.reduce((sum, sale) => sum + (sale.grandTotal - sale.totalCost), 0);

        setMonthlyStats({
            revenue: monthlyRevenue,
            profit: monthlyProfit,
            sales: monthlySales.length,
        });
    }, [allSales]);

    // Clear all data for testing
    const handleClearAllData = async () => {
        if (!orgId) return;

        setClearing(true);
        try {
            const batch = writeBatch(db);

            // Delete all products
            const productsQ = query(collection(db, 'products'), where('orgId', '==', orgId));
            const productsSnapshot = await getDocs(productsQ);
            productsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete all sales
            const salesQ = query(collection(db, 'sales'), where('orgId', '==', orgId));
            const salesSnapshot = await getDocs(salesQ);
            salesSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete all stock movements
            const movementsQ = query(collection(db, 'stockMovements'), where('orgId', '==', orgId));
            const movementsSnapshot = await getDocs(movementsQ);
            movementsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete all daily stats
            const statsQ = query(collection(db, 'dailyStats'), where('orgId', '==', orgId));
            const statsSnapshot = await getDocs(statsQ);
            statsSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete all customers
            const customersQ = query(collection(db, 'customers'), where('orgId', '==', orgId));
            const customersSnapshot = await getDocs(customersQ);
            customersSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            setShowConfirmDialog(false);
            alert('✅ All data cleared successfully!');
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('❌ Error clearing data. Please try again.');
        } finally {
            setClearing(false);
        }
    };

    // Calculate metrics
    const todayRevenue = todayStats?.totalSalesAmount || 0;
    const todayProfit = todayStats?.totalProfit || 0;
    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.currentStock <= p.lowStockThreshold).length;

    const totalUdhaar = customers.reduce((sum, customer) => sum + (customer.totalCredit || 0), 0);

    // Calculate overdue (> 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const overdueUdhaar = customers.reduce((sum, customer) => {
        if ((customer.totalCredit || 0) > 0 && customer.lastVisit && customer.lastVisit < thirtyDaysAgo) {
            return sum + customer.totalCredit;
        }
        return sum;
    }, 0);

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
                <p className="mt-2 text-neutral-600">
                    Welcome back! Here's an overview of your business.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="mb-8">
                <SummaryCards
                    todayRevenue={todayRevenue}
                    todayProfit={todayProfit}

                    lowStockCount={lowStockCount}
                    totalUdhaar={totalUdhaar}
                    overdueUdhaar={overdueUdhaar}
                    loading={loading}
                />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <QuickActions />
            </div>

            {/* Profit Analytics Section */}
            <div className="mb-8 grid gap-6 sm:grid-cols-3">
                <div className="rounded-lg border border-neutral-200 bg-white p-6">
                    <div className="mb-2 text-sm text-neutral-600">Today's Profit</div>
                    <div className={`text-2xl font-bold ${todayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{todayProfit.toFixed(2)}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                        {todayStats?.totalBills || 0} bills today
                    </div>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-6">
                    <div className="mb-2 text-sm text-neutral-600">Monthly Profit</div>
                    <div className={`text-2xl font-bold ${monthlyStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{monthlyStats.profit.toFixed(2)}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                        {monthlyStats.sales} sales this month
                    </div>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-6">
                    <div className="mb-2 text-sm text-neutral-600">Monthly Revenue</div>
                    <div className="text-2xl font-bold text-neutral-900">
                        ₹{monthlyStats.revenue.toFixed(2)}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                        Total sales value
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex flex-col gap-6">
                {/* Sales Trend Chart (Full Width) */}
                <SalesTrendChart dailyStats={dailyStats} loading={loading} />

                {/* Row 1: Alerts & Top Products */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <LowStockAlert products={products} loading={loading} />
                    <TopProducts products={products} loading={loading} />
                </div>

                {/* Row 2: Intelligence & Analytics */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <DeadStockList products={products} loading={loading} />
                    <ProductPerformanceChart products={products} loading={loading} />
                </div>
            </div>

            {/* Recent Sales */}
            <div className="mt-6">
                <RecentSales sales={sales} loading={loading} />
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={handleClearAllData}
                title="Clear All Data"
                message="Are you sure you want to delete all data? This action cannot be undone. This includes all products, sales, customers, and statistics."
                confirmText="Delete Everything"
            />
        </div>
    );
}
