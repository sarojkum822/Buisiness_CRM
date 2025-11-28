'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label
} from 'recharts';
import { DailyStats } from '@/types';

interface SalesTrendChartProps {
    dailyStats: DailyStats[];
    loading?: boolean;
}

export function SalesTrendChart({ dailyStats, loading = false }: SalesTrendChartProps) {
    if (loading) {
        return (
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <div className="mb-4">
                    <div className="mb-2 h-6 w-48 animate-pulse rounded bg-neutral-200"></div>
                    <div className="h-4 w-32 animate-pulse rounded bg-neutral-100"></div>
                </div>
                <div className="h-[300px] w-full animate-pulse rounded bg-neutral-50"></div>
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

    // CustomTooltip moved outside or defined here properly
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
                    <p className="font-semibold text-neutral-900">{label}</p>
                    <div className="mt-1 space-y-1 text-xs text-neutral-600">
                        <p>Sales: <span className="font-medium text-blue-600">₹{payload[0].value.toFixed(2)}</span></p>
                        <p>Profit: <span className="font-medium text-green-600">₹{payload[1].value.toFixed(2)}</span></p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-neutral-900">Sales Trend</h2>
                <p className="text-sm text-neutral-600">Revenue & Profit (Last 7 Days)</p>
            </div>

            {data.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-center">
                    <div>
                        <div className="mb-2 text-4xl">📉</div>
                        <p className="text-sm text-neutral-600">No sales data recorded yet</p>
                    </div>
                </div>
            ) : (
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 20,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis
                                dataKey="date"
                                stroke="#666"
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#666"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="sales"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#2563eb' }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="profit"
                                stroke="#16a34a"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#16a34a' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
