'use client';

import React from 'react';
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
    gradient: string;
    sparklineData?: { value: number }[];
    sparklineColor?: string;
}

export function EnhancedMetricCard({
    title,
    value,
    trend,
    icon: Icon,
    gradient,
    sparklineData,
    sparklineColor = '#fff',
}: EnhancedMetricCardProps) {
    return (
        <div className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg ${gradient}`}>
            <div className="flex items-start justify-between">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-white/80">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold">{value}</h3>
                    {trend && (
                        <div className="mt-2 flex items-center gap-1 text-sm">
                            <span
                                className={`rounded-full bg-white/20 px-1.5 py-0.5 font-medium ${trend.isPositive ? 'text-green-100' : 'text-red-100'
                                    }`}
                            >
                                {trend.isPositive ? '↑' : '↓'} {trend.value}
                            </span>
                            <span className="text-white/60">{trend.label}</span>
                        </div>
                    )}
                </div>
                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Sparkline Chart */}
            {sparklineData && sparklineData.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={sparklineColor}
                                fill={sparklineColor}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
