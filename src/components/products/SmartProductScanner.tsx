'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import BarcodeScanner from '@/components/stock/BarcodeScanner';
import { useAuth } from '@/lib/auth/AuthContext';
import { findProductByBarcode } from '@/lib/firestore/products';
import { QueueItem } from '@/components/products/QueueItem';

const CATEGORIES = ['Electronics', 'Groceries', 'Clothing', 'Hardware', 'Other'];

interface QueuedItemData {
    id: string;
    type: 'new' | 'update';
    barcode: string;
    productId?: string;
    originalStock?: number;
    data: {
        name: string;
        sku: string;
        barcode: string;
        category: string;
        costPrice: number;
        sellingPrice: number;
        currentStock: number;
        lowStockThreshold: number;
    };
}

interface SmartProductScannerProps {
    onSaveAll: (items: QueuedItemData[]) => Promise<void>;
    onClose: () => void;
}

export function SmartProductScanner({ onSaveAll, onClose }: SmartProductScannerProps) {
    const { orgId } = useAuth();
    const [showScanner, setShowScanner] = useState(true);
    const [queue, setQueue] = useState<QueuedItemData[]>([]);
    const [currentItem, setCurrentItem] = useState<QueuedItemData | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Track last scanned barcode for debouncing
    const lastScannedRef = useRef('');
    const lastScanTimeRef = useRef(0);

    // Generate temporary ID for queue items
    const generateId = () => `temp_${Date.now()}_${Math.random()}`;

    // Handle barcode scan
    const handleBarcodeScan = async (barcode: string) => {
        // Debounce: Ignore scans of same barcode within 2 seconds
        const now = Date.now();
        if (lastScannedRef.current === barcode && now - lastScanTimeRef.current < 2000) {
            console.log('⏭️ Duplicate scan ignored:', barcode);
            return;
        }
        lastScannedRef.current = barcode;
        lastScanTimeRef.current = now;

        if (!orgId) {
            alert('Error: Organization ID not found');
            return;
        }

        setLoading(true);
        try {
            // Check if product exists
            const existingProduct = await findProductByBarcode(orgId, barcode);

            if (existingProduct) {
                // Existing product - create update item
                const queueItem: QueuedItemData = {
                    id: generateId(),
                    type: 'update',
                    barcode,
                    productId: existingProduct.id,
                    originalStock: existingProduct.currentStock,
                    data: {
                        name: existingProduct.name,
                        sku: existingProduct.sku,
                        barcode: existingProduct.barcode || barcode,
                        category: existingProduct.category,
                        costPrice: existingProduct.costPrice,
                        sellingPrice: existingProduct.sellingPrice,
                        currentStock: existingProduct.currentStock + 1, // Increment by 1
                        lowStockThreshold: existingProduct.lowStockThreshold,
                    },
                };
                setCurrentItem(queueItem);
                console.log('📦 Loaded existing product:', existingProduct.name);
            } else {
                // New product - create with auto-generated values
                const queueItem: QueuedItemData = {
                    id: generateId(),
                    type: 'new',
                    barcode,
                    data: {
                        name: `Item ${barcode}`,
                        sku: `SKU-${barcode}`,
                        barcode,
                        category: 'Other',
                        costPrice: 0,
                        sellingPrice: 0,
                        currentStock: 1,
                        lowStockThreshold: 10,
                    },
                };
                setCurrentItem(queueItem);
                console.log('🆕 Created new product template:', queueItem.data.name);
            }
        } catch (error) {
            console.error('Error loading product:', error);
            alert('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    // Add current item to queue
    const handleAddToQueue = () => {
        if (!currentItem) return;

        // Validate current item
        if (!currentItem.data.name.trim()) {
            setErrors({ name: 'Product name is required' });
            return;
        }

        // Check if item with same barcode already in queue
        const existingIndex = queue.findIndex(item => item.barcode === currentItem.barcode);

        if (existingIndex >= 0) {
            // Replace existing item in queue
            const newQueue = [...queue];
            newQueue[existingIndex] = currentItem;
            setQueue(newQueue);
        } else {
            // Add new item to queue
            setQueue([...queue, currentItem]);
        }

        console.log('➕ Added to queue:', currentItem.data.name);

        // Clear current item
        setCurrentItem(null);
        setErrors({});
    };

    // Skip current item
    const handleSkip = () => {
        setCurrentItem(null);
        setErrors({});
    };

    // Edit item from queue
    const handleEditFromQueue = (item: QueuedItemData) => {
        // Remove from queue and load into current
        setQueue(queue.filter(q => q.id !== item.id));
        setCurrentItem(item);
    };

    // Delete item from queue
    const handleDeleteFromQueue = (id: string) => {
        setQueue(queue.filter(item => item.id !== id));
    };

    // Clear all items
    const handleClearAll = () => {
        if (confirm('Are you sure you want to clear all scanned items?')) {
            setQueue([]);
            setCurrentItem(null);
        }
    };

    // Save all items
    const handleSave = async () => {
        if (queue.length === 0) {
            alert('No items to save');
            return;
        }

        setLoading(true);
        try {
            await onSaveAll(queue);
            setQueue([]);
            setCurrentItem(null);
        } catch (error) {
            console.error('Error saving items:', error);
            alert('Failed to save some items');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[85vh] flex-col lg:flex-row gap-6">
            {/* LEFT PANEL - Scanner & Current Item */}
            <div className="flex flex-col gap-4 lg:w-2/5">
                {/* Scanner Toggle */}
                <div className="flex items-center justify-between">
                    <label className={`relative inline-flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2 transition-all ${showScanner ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-200 hover:bg-neutral-50'
                        }`}>
                        <input
                            type="checkbox"
                            checked={showScanner}
                            onChange={(e) => setShowScanner(e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className={`flex h-5 w-9 items-center rounded-full p-1 transition-colors ${showScanner ? 'bg-blue-600' : 'bg-neutral-300'
                            }`}>
                            <div className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${showScanner ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                        </div>
                        <span className={`text-sm font-medium ${showScanner ? 'text-blue-700' : 'text-neutral-600'
                            }`}>
                            Camera Scanner
                        </span>
                    </label>
                </div>

                {/* Camera Scanner */}
                {showScanner && (
                    <div className="rounded-xl border border-neutral-200 bg-black overflow-hidden">
                        <BarcodeScanner
                            onScan={handleBarcodeScan}
                            variant="embedded"
                            autoStart={true}
                            keepOpenOnScan={true}
                        />
                    </div>
                )}

                {/* Current Scanned Item */}
                {currentItem && (
                    <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm overflow-y-auto">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                            {currentItem.type === 'new' ? '🆕 New Product' : '📦 Update Stock'}
                        </h3>

                        <div className="space-y-4">
                            <Input
                                label="Product Name"
                                value={currentItem.data.name}
                                onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    data: { ...currentItem.data, name: e.target.value }
                                })}
                                error={errors.name}
                                className="text-lg font-medium"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Barcode"
                                    value={currentItem.data.barcode}
                                    readOnly
                                    className="bg-neutral-50"
                                />
                                <Input
                                    label="SKU"
                                    value={currentItem.data.sku}
                                    onChange={(e) => setCurrentItem({
                                        ...currentItem,
                                        data: { ...currentItem.data, sku: e.target.value }
                                    })}
                                />
                            </div>

                            <Select
                                label="Category"
                                value={currentItem.data.category}
                                onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    data: { ...currentItem.data, category: e.target.value }
                                })}
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </Select>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Cost Price"
                                    type="number"
                                    value={currentItem.data.costPrice}
                                    onChange={(e) => setCurrentItem({
                                        ...currentItem,
                                        data: { ...currentItem.data, costPrice: parseFloat(e.target.value) || 0 }
                                    })}
                                    icon={<span className="text-neutral-500">₹</span>}
                                />
                                <Input
                                    label="Selling Price"
                                    type="number"
                                    value={currentItem.data.sellingPrice}
                                    onChange={(e) => setCurrentItem({
                                        ...currentItem,
                                        data: { ...currentItem.data, sellingPrice: parseFloat(e.target.value) || 0 }
                                    })}
                                    icon={<span className="text-neutral-500">₹</span>}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <Input
                                        label="Current Stock"
                                        type="number"
                                        value={currentItem.data.currentStock}
                                        onChange={(e) => setCurrentItem({
                                            ...currentItem,
                                            data: { ...currentItem.data, currentStock: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                    {currentItem.originalStock !== undefined && (
                                        <div className="absolute -right-2 -top-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-lg ring-2 ring-white">
                                            <Plus className="h-3 w-3" />
                                            <span>{currentItem.data.currentStock - currentItem.originalStock}</span>
                                        </div>
                                    )}
                                </div>
                                <Input
                                    label="Low Stock Alert"
                                    type="number"
                                    value={currentItem.data.lowStockThreshold}
                                    onChange={(e) => setCurrentItem({
                                        ...currentItem,
                                        data: { ...currentItem.data, lowStockThreshold: parseInt(e.target.value) || 0 }
                                    })}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={handleSkip}
                                    className="flex-1"
                                >
                                    Skip
                                </Button>
                                <Button
                                    onClick={handleAddToQueue}
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    Add to Queue
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {!currentItem && !loading && (
                    <div className="flex-1 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 flex items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                                <AlertCircle className="h-8 w-8 text-neutral-400" />
                            </div>
                            <p className="text-neutral-600 font-medium">
                                {showScanner ? 'Scan a barcode to start' : 'Enable camera scanner'}
                            </p>
                            <p className="text-sm text-neutral-500 mt-1">
                                Items will appear here for editing
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT PANEL - Queue */}
            <div className="flex flex-col flex-1 rounded-xl border border-neutral-200 bg-white shadow-sm">
                {/* Queue Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 p-4">
                    <h3 className="text-lg font-semibold text-neutral-900">
                        Scanned Items Queue
                        <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-bold text-blue-700">
                            {queue.length}
                        </span>
                    </h3>
                    {queue.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAll}
                        >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Queue List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {queue.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="text-center">
                                <div className="mx-auto h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                                    <CheckCircle className="h-8 w-8 text-neutral-400" />
                                </div>
                                <p className="text-neutral-600 font-medium">No items in queue</p>
                                <p className="text-sm text-neutral-500 mt-1">
                                    Scan products and add them to the queue
                                </p>
                            </div>
                        </div>
                    ) : (
                        queue.map((item) => (
                            <QueueItem
                                key={item.id}
                                item={item}
                                onEdit={handleEditFromQueue}
                                onDelete={handleDeleteFromQueue}
                            />
                        ))
                    )}
                </div>

                {/* Action Bar */}
                <div className="border-t border-neutral-100 bg-neutral-50 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-700">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium">
                                {queue.length} {queue.length === 1 ? 'item' : 'items'} ready
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={queue.length === 0 || loading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {loading ? 'Saving...' : `Save All Products`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
