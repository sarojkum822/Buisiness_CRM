'use client';

import React, { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { DailyStats } from '@/types';

interface SalesTrendChartProps {
    dailyStats: DailyStats[];
    loading?: boolean;
}

export function SalesTrendChart({ dailyStats, loading = false }: SalesTrendChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (loading || !mounted) {
        return (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="mb-2 h-6 w-32 animate-pulse rounded bg-neutral-200"></div>
                        <div className="h-4 w-24 animate-pulse rounded bg-neutral-100"></div>
                    </div>
                    <div className="h-8 w-24 animate-pulse rounded bg-neutral-100"></div>
                </div>
                <div className="h-[300px] w-full animate-pulse rounded-lg bg-neutral-50"></div>
            </div>
        );
    }

    // Sort stats by date and take last 7 days
    const data = [...dailyStats]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7)
        .map(stat => ({
            date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: stat.totalSalesAmount,
            profit: stat.totalProfit
        }));

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-neutral-900">Sales Trend</h2>
                    <p className="text-sm text-neutral-500">Revenue & Profit Overview</p>
                </div>
                <select className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-600 outline-none focus:border-blue-500">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                </select>
            </div>

            {data.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-center">
                    <div>
                        <div className="mb-2 text-4xl">📉</div>
                        <p className="text-sm text-neutral-600">No sales data recorded yet</p>
                    </div>
                </div>
            ) : (
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorSales)"
                            />
                            <Area
                                type="monotone"
                                dataKey="profit"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorProfit)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
                <p className="mb-2 font-semibold text-neutral-900">{label}</p>
                <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-neutral-600">Sales:</span>
                        <span className="font-medium text-blue-600">₹{payload[0].value.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-neutral-600">Profit:</span>
                        <span className="font-medium text-green-600">₹{payload[1].value.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};
