'use client';

import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface EnhancedMetricCardProps {
    title: string;
    value: string;
    trend?: {
        value: string;
        isPositive: boolean;
        label: string;
    };
    icon: LucideIcon;
    color: 'blue' | 'purple' | 'green' | 'orange';
    sparklineData?: { value: number }[];
}

const colorStyles = {
    blue: {
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        trendPositive: 'text-blue-600 bg-blue-50',
        trendNegative: 'text-red-600 bg-red-50',
        stroke: '#2563eb', // blue-600
        fill: '#eff6ff', // blue-50
    },
    purple: {
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-600',
        trendPositive: 'text-purple-600 bg-purple-50',
        trendNegative: 'text-red-600 bg-red-50',
        stroke: '#9333ea', // purple-600
        fill: '#faf5ff', // purple-50
    },
    green: {
        iconBg: 'bg-green-50',
        iconColor: 'text-green-600',
        trendPositive: 'text-green-600 bg-green-50',
        trendNegative: 'text-red-600 bg-red-50',
        stroke: '#16a34a', // green-600
        fill: '#f0fdf4', // green-50
    },
    orange: {
        iconBg: 'bg-orange-50',
        iconColor: 'text-orange-600',
        trendPositive: 'text-orange-600 bg-orange-50',
        trendNegative: 'text-red-600 bg-red-50',
        stroke: '#ea580c', // orange-600
        fill: '#fff7ed', // orange-50
    },
};

export function EnhancedMetricCard({
    title,
    value,
    trend,
    icon: Icon,
    color,
    sparklineData,
}: EnhancedMetricCardProps) {
    const [mounted, setMounted] = useState(false);
    const styles = colorStyles[color];

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-neutral-500">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold text-neutral-900">{value}</h3>
                    {trend && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <span
                                className={`flex items-center rounded-full px-2 py-0.5 font-medium ${trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}
                            >
                                {trend.isPositive ? '↑' : '↓'} {trend.value}
                            </span>
                            <span className="text-neutral-400">{trend.label}</span>
                        </div>
                    )}
                </div>
                <div className={`rounded-lg p-3 ${styles.iconBg}`}>
                    <Icon className={`h-6 w-6 ${styles.iconColor}`} />
                </div>
            </div>

            {/* Sparkline Chart */}
            {mounted && sparklineData && sparklineData.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={sparklineData}>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={styles.stroke}
                                fill={styles.stroke}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
