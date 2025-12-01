'use client';

import React from 'react';
import { X, Check, Smartphone, Zap, BarChart3, ShieldCheck } from 'lucide-react';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm md:inset-0">
            <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="p-6 md:p-10">
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <h2 className="mb-3 text-3xl font-bold text-neutral-900">Upgrade to ShopCRM Pro</h2>
                        <p className="text-lg text-neutral-600">Unlock powerful features to grow your business and manage it effortlessly.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Free Plan */}
                        <div className="relative flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-neutral-900">Free Plan</h3>
                                <p className="mt-2 text-sm text-neutral-500">Perfect for getting started</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-neutral-900">₹0</span>
                                <span className="text-neutral-500"> / month</span>
                            </div>
                            <ul className="mb-8 flex-1 space-y-4">
                                <li className="flex items-center gap-3 text-neutral-700">
                                    <Check className="h-5 w-5 text-neutral-400" />
                                    <span>Basic Inventory Management</span>
                                </li>
                                <li className="flex items-center gap-3 text-neutral-700">
                                    <Check className="h-5 w-5 text-neutral-400" />
                                    <span>Unlimited Bills</span>
                                </li>
                                <li className="flex items-center gap-3 text-neutral-700">
                                    <Check className="h-5 w-5 text-neutral-400" />
                                    <span>Daily Sales Reports</span>
                                </li>
                            </ul>
                            <button
                                disabled
                                className="w-full rounded-xl border border-neutral-300 bg-white py-3 font-semibold text-neutral-400"
                            >
                                Current Plan
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-blue-600 bg-white p-8 shadow-xl">
                            <div className="absolute right-0 top-0 rounded-bl-xl bg-blue-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                                Recommended
                            </div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-neutral-900">Pro Plan</h3>
                                <p className="mt-2 text-sm text-neutral-500">For growing businesses</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-neutral-900">₹499</span>
                                <span className="text-neutral-500"> / month</span>
                            </div>
                            <ul className="mb-8 flex-1 space-y-4">
                                <li className="flex items-center gap-3 font-medium text-neutral-900">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <span>WhatsApp Integration 📱</span>
                                </li>
                                <li className="flex items-center gap-3 text-neutral-700">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <span>Advanced Analytics</span>
                                </li>
                                <li className="flex items-center gap-3 text-neutral-700">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <span>Priority Support</span>
                                </li>
                            </ul>
                            <button
                                onClick={onClose}
                                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-200"
                            >
                                Start 14-Day Free Trial
                            </button>
                            <p className="mt-4 text-center text-xs text-neutral-500">
                                No credit card required for trial
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
