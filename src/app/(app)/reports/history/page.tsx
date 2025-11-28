'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { DailyStats } from '@/types';
import { Input } from '@/components/ui/Input';

interface MonthlyStats {
    id: string;
    month: string;
    totalSalesAmount: number;
    totalCostAmount: number;
    totalProfit: number;
    totalBills: number;
    totalItemsSold: number;
}

export default function HistoryPage() {
    const { orgId } = useAuth();
    const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
    const [dailyData, setDailyData] = useState<DailyStats[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Daily Stats (Client-side sort to avoid index)
                const dailyRef = collection(db, 'dailyStats');
                const dailyQ = query(dailyRef, where('orgId', '==', orgId));
                const dailySnapshot = await getDocs(dailyQ);

                const daily = dailySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as DailyStats[];

                // Sort by date desc and take last 30
                daily.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setDailyData(daily.slice(0, 30));

                // Fetch Monthly Stats (Client-side sort to avoid index)
                const monthlyRef = collection(db, 'monthlyStats');
                const monthlyQ = query(monthlyRef, where('orgId', '==', orgId));
                const monthlySnapshot = await getDocs(monthlyQ);

                const monthly = monthlySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as MonthlyStats[];

                // Sort by month desc and take last 12
                monthly.sort((a, b) => b.month.localeCompare(a.month));
                setMonthlyData(monthly.slice(0, 12));

            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orgId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [customStats, setCustomStats] = useState<{ revenue: number; profit: number; count: number } | null>(null);

    const calculateCustomRange = () => {
        if (!startDate || !endDate) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        const filtered = dailyData.filter(day => {
            const dayDate = new Date(day.date);
            return dayDate >= start && dayDate <= end;
        });

        const revenue = filtered.reduce((sum, day) => sum + day.totalSalesAmount, 0);
        const profit = filtered.reduce((sum, day) => sum + day.totalProfit, 0);
        const count = filtered.reduce((sum, day) => sum + day.totalBills, 0);

        setCustomStats({ revenue, profit, count });
    };

    return (
        <div className="p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">History & Analytics</h1>
                <p className="mt-2 text-neutral-600">
                    View your past performance data.
                </p>
            </div>

            {/* Custom Range Calculator */}
            <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-neutral-900">Custom Profit Calculator</h2>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-full sm:w-auto">
                        <Input
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full sm:w-48"
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <Input
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full sm:w-48"
                        />
                    </div>
                    <button
                        onClick={calculateCustomRange}
                        disabled={!startDate || !endDate}
                        className="mb-0.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                        Calculate
                    </button>
                </div>

                {customStats && (
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-neutral-50 p-4">
                            <div className="text-sm text-neutral-500">Total Revenue</div>
                            <div className="text-xl font-bold text-neutral-900">{formatCurrency(customStats.revenue)}</div>
                        </div>
                        <div className="rounded-lg bg-neutral-50 p-4">
                            <div className="text-sm text-neutral-500">Total Profit</div>
                            <div className={`text-xl font-bold ${customStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(customStats.profit)}
                            </div>
                        </div>
                        <div className="rounded-lg bg-neutral-50 p-4">
                            <div className="text-sm text-neutral-500">Total Sales</div>
                            <div className="text-xl font-bold text-neutral-900">{customStats.count}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="mb-6 flex border-b border-neutral-200">
                <button
                    onClick={() => setActiveTab('daily')}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'daily'
                        ? 'border-b-2 border-neutral-900 text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    Daily History
                </button>
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'monthly'
                        ? 'border-b-2 border-neutral-900 text-neutral-900'
                        : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    Monthly History
                </button>
            </div>

            {/* Content */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 text-neutral-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">{activeTab === 'daily' ? 'Date' : 'Month'}</th>
                                <th className="px-6 py-4 font-medium">Sales Count</th>
                                <th className="px-6 py-4 font-medium">Items Sold</th>
                                <th className="px-6 py-4 font-medium">Revenue</th>
                                <th className="px-6 py-4 font-medium">Profit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {loading ? (
                                // Skeleton Rows
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-neutral-200"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 rounded bg-neutral-200"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-12 rounded bg-neutral-200"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-neutral-200"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-neutral-200"></div></td>
                                    </tr>
                                ))
                            ) : activeTab === 'daily' ? (
                                dailyData.length > 0 ? (
                                    dailyData.map((day) => (
                                        <tr key={day.id} className="hover:bg-neutral-50">
                                            <td className="px-6 py-4 font-medium text-neutral-900">
                                                {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600">{day.totalBills}</td>
                                            <td className="px-6 py-4 text-neutral-600">{day.totalItemsSold}</td>
                                            <td className="px-6 py-4 font-medium text-neutral-900">{formatCurrency(day.totalSalesAmount)}</td>
                                            <td className={`px-6 py-4 font-medium ${day.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(day.totalProfit)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                            No daily history found.
                                        </td>
                                    </tr>
                                )
                            ) : (
                                monthlyData.length > 0 ? (
                                    monthlyData.map((month) => (
                                        <tr key={month.id} className="hover:bg-neutral-50">
                                            <td className="px-6 py-4 font-medium text-neutral-900">
                                                {/* Convert YYYY-MM to Month Year */}
                                                {new Date(month.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600">{month.totalBills}</td>
                                            <td className="px-6 py-4 text-neutral-600">{month.totalItemsSold}</td>
                                            <td className="px-6 py-4 font-medium text-neutral-900">{formatCurrency(month.totalSalesAmount)}</td>
                                            <td className={`px-6 py-4 font-medium ${month.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(month.totalProfit)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                            No monthly history found.
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
