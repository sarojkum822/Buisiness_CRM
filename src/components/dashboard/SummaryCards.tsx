'use client';

import React from 'react';

import Link from 'next/link';

interface SummaryCard {
    label: string;
    value: string | number;
    icon: string;
    color: string;
    tooltip?: string;
    subValue?: string;
    link?: string;
}

export interface SummaryCardsProps {
    todayRevenue: number;
    todayProfit: number;
    lowStockCount: number;
    totalUdhaar: number;
    overdueUdhaar: number;
    loading?: boolean;
}

export function SummaryCards({
    todayRevenue,
    todayProfit,
    lowStockCount,
    totalUdhaar,
    overdueUdhaar,
    loading = false,
}: SummaryCardsProps) {
    const cards: SummaryCard[] = [
        {
            label: "Today's Revenue",
            value: `₹${todayRevenue.toFixed(2)}`,
            icon: '💰',
            color: 'bg-blue-50 text-blue-600',
            tooltip: 'Total sales amount collected today',
        },
        {
            label: "Today's Profit",
            value: `₹${todayProfit.toFixed(2)}`,
            icon: '📈',
            color: todayProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600',
            tooltip: 'Net profit from today\'s sales',
        },
        {
            label: 'Total Udhaar',
            value: `₹${totalUdhaar.toFixed(2)}`,
            subValue: overdueUdhaar > 0 ? `₹${overdueUdhaar.toFixed(2)} overdue` : undefined,
            icon: '📒',
            color: totalUdhaar > 0 ? 'bg-red-50 text-red-600' : 'bg-neutral-50 text-neutral-600',
            tooltip: 'Total outstanding credit (Overdue > 30 days)',
            link: '/customers',
        },
        {
            label: 'Low Stock Items',
            value: lowStockCount,
            icon: '⚠️',
            color: lowStockCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-neutral-50 text-neutral-600',
            tooltip: 'Products below their minimum stock level',
            link: '/restock',
        },
    ];

    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border border-neutral-200 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div className="w-full">
                                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-neutral-100"></div>
                                <div className="h-8 w-32 animate-pulse rounded bg-neutral-200"></div>
                            </div>
                            <div className="h-12 w-12 animate-pulse rounded-lg bg-neutral-100"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => {
                const CardContent = (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-neutral-600">{card.label}</p>
                                <p className="mt-2 text-2xl font-bold text-neutral-900">{card.value}</p>
                                {card.subValue && (
                                    <p className="mt-1 text-xs font-medium text-red-600">
                                        {card.subValue}
                                    </p>
                                )}
                            </div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
                                <span className="text-2xl">{card.icon}</span>
                            </div>
                        </div>
                    </>
                );

                if (card.link) {
                    return (
                        <Link
                            key={index}
                            href={card.link}
                            className="group relative rounded-lg border border-neutral-200 bg-white p-6 transition-all hover:shadow-md hover:border-blue-200"
                            title={card.tooltip}
                        >
                            {CardContent}
                        </Link>
                    );
                }

                return (
                    <div
                        key={index}
                        className="group relative rounded-lg border border-neutral-200 bg-white p-6 transition-all hover:shadow-md"
                        title={card.tooltip}
                    >
                        {CardContent}
                    </div>
                );
            })}
        </div>
    );
}
