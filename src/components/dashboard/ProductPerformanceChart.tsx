'use client';

import React from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label,
    Cell
} from 'recharts';
import { Product } from '@/types';

interface ProductPerformanceChartProps {
    products: Product[];
    loading?: boolean;
}

export function ProductPerformanceChart({ products, loading = false }: ProductPerformanceChartProps) {
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

    // Transform data for the chart
    // X: Price (sellingPrice)
    // Y: Sales (totalSoldQty)
    // Z: Revenue (totalRevenue) - used for bubble size if we want, or just tooltip
    const data = products
        .filter(p => p.totalSoldQty > 0) // Only show products with sales
        .map(p => ({
            name: p.name,
            price: p.sellingPrice,
            sales: p.totalSoldQty,
            revenue: p.totalRevenue,
            stock: p.currentStock
        }));

    // Define colors for different performance tiers
    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
                    <p className="font-semibold text-neutral-900">{data.name}</p>
                    <div className="mt-1 space-y-1 text-xs text-neutral-600">
                        <p>Sales: <span className="font-medium text-neutral-900">{data.sales} units</span></p>
                        <p>Price: <span className="font-medium text-neutral-900">₹{data.price}</span></p>
                        <p>Revenue: <span className="font-medium text-neutral-900">₹{data.revenue.toFixed(2)}</span></p>
                        <p>Stock: <span className="font-medium text-neutral-900">{data.stock}</span></p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-neutral-900">Product Performance</h2>
                <p className="text-sm text-neutral-600">Price vs. Sales Volume</p>
            </div>

            {data.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-center">
                    <div>
                        <div className="mb-2 text-4xl">📉</div>
                        <p className="text-sm text-neutral-600">No sales data to visualize yet</p>
                    </div>
                </div>
            ) : (
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                            margin={{
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 20,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                            <XAxis
                                type="number"
                                dataKey="price"
                                name="Price"
                                unit="₹"
                                stroke="#666"
                                tick={{ fontSize: 12 }}
                            >
                                <Label value="Price (₹)" offset={-10} position="insideBottom" style={{ fontSize: 12, fill: '#666' }} />
                            </XAxis>
                            <YAxis
                                type="number"
                                dataKey="sales"
                                name="Sales"
                                unit=""
                                stroke="#666"
                                tick={{ fontSize: 12 }}
                            >
                                <Label value="Sales Count" angle={-90} position="insideLeft" style={{ fontSize: 12, fill: '#666' }} />
                            </YAxis>
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name="Products" data={data} fill="#8884d8">
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
