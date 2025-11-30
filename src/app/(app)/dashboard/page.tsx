'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot, query, orderBy, limit, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product, Sale, DailyStats, Customer } from '@/types';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { TopProducts } from '@/components/dashboard/TopProducts';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { EnhancedMetricCard } from '@/components/dashboard/EnhancedMetricCard';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';

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

    // Real-time customers listener
    useEffect(() => {
        if (!orgId) return;
        const q = query(collection(db, 'customers'), where('orgId', '==', orgId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
        });
        return () => unsubscribe();
    }, [orgId]);

    // Fetch initial data
    useEffect(() => {
        if (!orgId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch today's stats
                const todayStr = new Date().toISOString().split('T')[0];
                const todayQuery = query(
                    collection(db, 'dailyStats'),
                    where('date', '==', todayStr),
                    where('orgId', '==', orgId)
                );
                const todaySnapshot = await getDocs(todayQuery);
                setTodayStats(todaySnapshot.empty ? null : todaySnapshot.docs[0].data() as DailyStats);

                // Fetch products
                const productsSnapshot = await getDocs(query(collection(db, 'products'), where('orgId', '==', orgId)));
                setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

                // Fetch recent sales
                const salesQuery = query(
                    collection(db, 'sales'),
                    where('orgId', '==', orgId),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                );
                const salesSnapshot = await getDocs(salesQuery);
                setSales(salesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                } as Sale)));

                // Fetch all sales for monthly stats
                const allSalesQuery = query(collection(db, 'sales'), where('orgId', '==', orgId));
                const allSalesSnapshot = await getDocs(allSalesQuery);
                setAllSales(allSalesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                } as Sale)));

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orgId]);

    // Calculate monthly stats
    useEffect(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlySales = allSales.filter(sale => sale.createdAt >= firstDayOfMonth);

        setMonthlyStats({
            revenue: monthlySales.reduce((sum, sale) => sum + sale.grandTotal, 0),
            profit: monthlySales.reduce((sum, sale) => sum + (sale.grandTotal - sale.totalCost), 0),
            sales: monthlySales.length,
        });
    }, [allSales]);

    // Real-time daily stats for chart
    useEffect(() => {
        if (!orgId) return;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

        const q = query(
            collection(db, 'dailyStats'),
            where('orgId', '==', orgId),
            where('date', '>=', dateStr),
            orderBy('date', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setDailyStats(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            } as DailyStats)));
        });

        return () => unsubscribe();
    }, [orgId]);

    // Calculate stats for cards
    const totalRevenue = todayStats?.totalSalesAmount || 0;
    const totalSales = todayStats?.totalBills || 0;
    const totalProfit = todayStats?.totalProfit || 0;
    const totalCustomers = customers.length;

    // Mock trend data
    const revenueTrend = { value: '12%', isPositive: true, label: 'vs yesterday' };
    const salesTrend = { value: '8%', isPositive: true, label: 'vs yesterday' };
    const profitTrend = { value: '15%', isPositive: true, label: 'vs yesterday' };
    const customerTrend = { value: '3', isPositive: true, label: 'new today' };

    const sparklineData1 = [{ value: 10 }, { value: 15 }, { value: 12 }, { value: 20 }, { value: 18 }, { value: 25 }, { value: 22 }];
    const sparklineData2 = [{ value: 5 }, { value: 8 }, { value: 6 }, { value: 10 }, { value: 9 }, { value: 12 }, { value: 11 }];
    const sparklineData3 = [{ value: 200 }, { value: 250 }, { value: 220 }, { value: 300 }, { value: 280 }, { value: 350 }, { value: 320 }];
    const sparklineData4 = [{ value: 100 }, { value: 102 }, { value: 105 }, { value: 108 }, { value: 110 }, { value: 112 }, { value: 115 }];

    return (
        <div className="min-h-screen bg-neutral-50 p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
                    <p className="text-neutral-600">Welcome back, Saroj Kumar</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-neutral-600">
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowConfirmDialog(true)}>Clear Data</Button>
                </div>
            </div>

            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <EnhancedMetricCard
                    title="Today's Revenue"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    trend={revenueTrend}
                    icon={DollarSign}
                    gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                    sparklineData={sparklineData1}
                />
                <EnhancedMetricCard
                    title="Today's Sales"
                    value={`${totalSales} bills`}
                    trend={salesTrend}
                    icon={ShoppingBag}
                    gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                    sparklineData={sparklineData2}
                />
                <EnhancedMetricCard
                    title="Today's Profit"
                    value={`₹${totalProfit.toLocaleString()}`}
                    trend={profitTrend}
                    icon={TrendingUp}
                    gradient="bg-gradient-to-br from-green-500 to-green-600"
                    sparklineData={sparklineData3}
                />
                <EnhancedMetricCard
                    title="Total Customers"
                    value={totalCustomers.toString()}
                    trend={customerTrend}
                    icon={Users}
                    gradient="bg-gradient-to-br from-orange-500 to-orange-600"
                    sparklineData={sparklineData4}
                />
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <SalesTrendChart dailyStats={dailyStats} loading={loading} />
                </div>
                <div className="space-y-6 lg:col-span-2">
                    <TopProducts products={products} loading={loading} />
                    <QuickActions />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <LowStockAlert products={products} loading={loading} />
                <RecentSales sales={sales} loading={loading} />
            </div>

            <ConfirmDialog
                isOpen={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={async () => {
                    if (!orgId) return;
                    setClearing(true);
                    try {
                        const batch = writeBatch(db);
                        const collections = ['sales', 'dailyStats', 'products'];

                        for (const colName of collections) {
                            const q = query(collection(db, colName), where('orgId', '==', orgId));
                            const snapshot = await getDocs(q);
                            snapshot.docs.forEach(doc => {
                                if (colName === 'products') {
                                    batch.update(doc.ref, { totalSoldQty: 0, totalRevenue: 0, totalProfit: 0 });
                                } else {
                                    batch.delete(doc.ref);
                                }
                            });
                        }

                        await batch.commit();
                        window.location.reload();
                    } catch (error) {
                        console.error('Error clearing data:', error);
                        alert('Failed to clear data');
                    } finally {
                        setClearing(false);
                        setShowConfirmDialog(false);
                    }
                }}
                title="Clear All Data"
                message="Are you sure you want to delete all sales and reset product stats? This action cannot be undone."
                confirmText={clearing ? 'Clearing...' : 'Clear Data'}
            />
        </div>
    );
}
