'use client';

import React, { useState } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';
import { TrendingUp, DollarSign, Clock, History, PlusCircle, Copy } from 'lucide-react';

interface EnhancedProductFormProps {
    product: Product;
    onSave: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchasedQty' | 'totalSoldQty' | 'totalRevenue' | 'totalCost'>, mode: 'create' | 'update', productId?: string) => Promise<void>;
    onCancel: () => void;
    onAdjustStock?: () => void;
    onViewHistory?: () => void;
    onDuplicate?: () => void;
}

const CATEGORIES = ['Electronics', 'Groceries', 'Clothing', 'Hardware', 'Other'];

export function EnhancedProductForm({ product, onSave, onCancel, onAdjustStock, onViewHistory, onDuplicate }: EnhancedProductFormProps) {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category: product.category || '',
        costPrice: product.costPrice?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        currentStock: product.currentStock?.toString() || '0',
        lowStockThreshold: product.lowStockThreshold?.toString() || '10',
    });

    // Calculate profit margin
    const costPrice = parseFloat(formData.costPrice) || 0;
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const profitAmount = sellingPrice - costPrice;
    const profitPercentage = costPrice > 0 ? ((profitAmount / costPrice) * 100).toFixed(2) : '0.00';

    // Stock status
    const currentStock = parseInt(formData.currentStock) || 0;
    const threshold = parseInt(formData.lowStockThreshold) || 10;
    const stockStatus = currentStock === 0 ? 'Out of Stock' : currentStock <= threshold ? 'Low Stock' : 'In Stock';
    const stockStatusColor = currentStock === 0 ? 'text-red-600 bg-red-100' : currentStock <= threshold ? 'text-yellow-600 bg-yellow-100' : 'text-green-600 bg-green-100';

    // Format date
    const formatDate = (date: Date | undefined) => {
        if (!date) return 'N/A';
        const now = new Date();
        const diff = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        return new Date(date).toLocaleDateString();
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Product name is required';
        }
        if (!formData.sku.trim()) {
            newErrors.sku = 'SKU is required';
        }
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }
        if (formData.costPrice === '' || parseFloat(formData.costPrice) < 0) {
            newErrors.costPrice = 'Cost price must be 0 or greater';
        }
        if (formData.sellingPrice === '' || parseFloat(formData.sellingPrice) < 0) {
            newErrors.sellingPrice = 'Selling price must be 0 or greater';
        }
        if (formData.currentStock === '' || parseInt(formData.currentStock) < 0) {
            newErrors.currentStock = 'Stock must be 0 or greater';
        }
        if (formData.lowStockThreshold === '' || parseInt(formData.lowStockThreshold) < 0) {
            newErrors.lowStockThreshold = 'Threshold must be 0 or greater';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const productData = {
                name: formData.name.trim(),
                sku: formData.sku.trim(),
                barcode: formData.barcode.trim() || undefined,
                category: formData.category,
                costPrice: parseFloat(formData.costPrice),
                sellingPrice: parseFloat(formData.sellingPrice),
                currentStock: parseInt(formData.currentStock),
                lowStockThreshold: parseInt(formData.lowStockThreshold),
                orgId: product.orgId,
            };

            await onSave(productData, 'update', product.id);
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrors({ submit: `Failed to save product. ${error instanceof Error ? error.message : 'Please try again.'}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-6 h-[75vh]">
            {/* LEFT PANEL - Edit Form */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {/* Product Information Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                        Product Information
                    </h3>

                    <Input
                        label="Product Name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        error={errors.name}
                        className="text-lg"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Barcode"
                            value={formData.barcode}
                            onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                            error={errors.barcode}
                            readOnly
                            className="bg-neutral-50"
                        />
                        <Input
                            label="SKU"
                            value={formData.sku}
                            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                            error={errors.sku}
                        />
                    </div>

                    <Select
                        label="Category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        error={errors.category}
                    >
                        <option value="">Select category</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Select>
                </div>

                {/* Pricing Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                        Pricing
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Cost Price"
                            type="number"
                            value={formData.costPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                            error={errors.costPrice}
                            icon={<span className="text-neutral-500">₹</span>}
                        />
                        <Input
                            label="Selling Price"
                            type="number"
                            value={formData.sellingPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                            error={errors.sellingPrice}
                            icon={<span className="text-neutral-500">₹</span>}
                        />
                    </div>

                    {/* Profit Margin Display */}
                    {costPrice > 0 && sellingPrice > 0 && (
                        <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-2 text-sm">
                            <span className="text-neutral-600">Profit Margin: </span>
                            <span className="font-semibold text-green-700">
                                ₹{profitAmount.toFixed(2)} ({profitPercentage}%)
                            </span>
                        </div>
                    )}
                </div>

                {/* Inventory Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                        Inventory
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Current Stock"
                            type="number"
                            value={formData.currentStock}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                            error={errors.currentStock}
                        />
                        <Input
                            label="Low Stock Alert"
                            type="number"
                            value={formData.lowStockThreshold}
                            onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                            error={errors.lowStockThreshold}
                        />
                    </div>

                    {/* Stock Status Badge */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-600">Status:</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${stockStatusColor}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            {stockStatus}
                        </span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - Stats & Actions */}
            <div className="w-96 flex flex-col gap-4 border-l border-neutral-200 pl-6">
                {/* Stats Cards */}
                <div className="space-y-3">
                    {/* Total Sold */}
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Sold</p>
                                <p className="mt-1 text-2xl font-bold text-blue-900">
                                    {product.totalSoldQty || 0} <span className="text-base font-normal text-blue-600">units</span>
                                </p>
                                <p className="mt-1 text-xs text-blue-600">All time</p>
                            </div>
                            <div className="rounded-lg bg-blue-500/20 p-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Revenue</p>
                                <p className="mt-1 text-2xl font-bold text-purple-900">
                                    ₹{(product.totalRevenue || 0).toLocaleString()}
                                </p>
                                <p className="mt-1 text-xs text-purple-600">
                                    Profit: ₹{((product.totalRevenue || 0) - (product.totalCost || 0)).toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-lg bg-purple-500/20 p-2">
                                <DollarSign className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    {/* Last Updated */}
                    <div className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Last Updated</p>
                                <p className="mt-1 text-2xl font-bold text-orange-900">
                                    {formatDate(product.updatedAt)}
                                </p>
                                <p className="mt-1 text-xs text-orange-600">
                                    Created: {formatDate(product.createdAt)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-orange-500/20 p-2">
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                        Quick Actions
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={onViewHistory}
                            className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white p-3 text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300"
                        >
                            <History className="h-4 w-4" />
                            <span className="text-xs font-medium">History</span>
                        </button>
                        <button
                            type="button"
                            onClick={onAdjustStock}
                            className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white p-3 text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300"
                        >
                            <PlusCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Stock</span>
                        </button>
                        <button
                            type="button"
                            onClick={onDuplicate}
                            className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white p-3 text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300"
                        >
                            <Copy className="h-4 w-4" />
                            <span className="text-xs font-medium">Duplicate</span>
                        </button>
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Submit Buttons */}
                <div className="space-y-3 border-t border-neutral-200 pt-4">
                    {product.updatedAt && (
                        <p className="text-xs text-neutral-500">
                            Last updated: {formatDate(product.updatedAt)}
                        </p>
                    )}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? 'Updating...' : 'Update Product'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
                <div className="fixed bottom-4 right-4 max-w-md rounded-lg bg-red-50 border border-red-200 p-4 shadow-lg">
                    <p className="text-sm text-red-800">{errors.submit}</p>
                </div>
            )}
        </form>
    );
}
