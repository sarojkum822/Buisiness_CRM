'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';
import BarcodeScanner from '@/components/stock/BarcodeScanner';
import { useAuth } from '@/lib/auth/AuthContext';
import { findProductByBarcode, searchProductsByName } from '@/lib/firestore/products';

interface ProductFormProps {
    product?: Product;
    initialBarcode?: string;
    onSave: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchasedQty' | 'totalSoldQty' | 'totalRevenue' | 'totalCost'>, mode: 'create' | 'update', productId?: string) => Promise<void>;
    onCancel: () => void;
}

const CATEGORIES = ['Electronics', 'Groceries', 'Clothing', 'Hardware', 'Other'];

export function ProductForm({ product, initialBarcode, onSave, onCancel }: ProductFormProps) {
    const { orgId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showScanner, setShowScanner] = useState(false);
    const [scanHistory, setScanHistory] = useState<{ name: string; time: string; status: 'new' | 'updated'; count?: number; isLowStock?: boolean }[]>([]);
    const [lastScanned, setLastScanned] = useState<string | null>(null);

    // Refs to handle rapid scanning race conditions
    const processingBarcode = useRef<string | null>(null);
    const pendingIncrements = useRef(0);

    // Track the actual product ID we are working with (might differ from props.product if we scanned something else)
    const [foundProductId, setFoundProductId] = useState<string | undefined>(product?.id);

    // Smart Add State
    const [isEditingExisting, setIsEditingExisting] = useState(!!product);
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    const [formData, setFormData] = useState({
        name: product?.name || '',
        sku: product?.sku || '',
        barcode: product?.barcode || initialBarcode || '',
        category: product?.category || '',
        costPrice: product?.costPrice?.toString() || '',
        sellingPrice: product?.sellingPrice?.toString() || '',
        currentStock: product?.currentStock?.toString() || '0',
        lowStockThreshold: product?.lowStockThreshold?.toString() || '10',
    });

    // Initialize form when product prop changes (only if not already editing a scanned product)
    useEffect(() => {
        if (product && !foundProductId && !isEditingExisting) {
            fillFormWithProduct(product);
        }
    }, [product, foundProductId, isEditingExisting]);

    // Initialize scanner audio
    const playBeep = () => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    };

    // Handle barcode lookup
    const handleBarcodeLookup = async (barcode: string) => {
        if (!orgId || !barcode.trim()) return;

        // Check if we are currently editing this product (either via previous scan or manual open)
        const isCurrentProduct = isEditingExisting && (formData.barcode === barcode || (product && product.barcode === barcode));

        // Case 1: Already scanned this item OR currently editing it - Steady state increment
        if ((lastScanned === barcode || isCurrentProduct) && !loading) {
            // If it's the same barcode, increment stock using functional update to prevent race conditions
            setFormData(prev => ({
                ...prev,
                currentStock: (parseInt(prev.currentStock || '0') + 1).toString()
            }));
            playBeep();
            setLastScanned(barcode); // Ensure lastScanned is updated

            // Update history - Grouping logic
            setScanHistory(prev => {
                const lastItem = prev[0];
                // Check if the last item in history matches the current product
                if (lastItem && lastItem.name === (formData.name || 'Unknown Item') && lastItem.status === 'updated') {
                    // Increment count of existing item
                    return [{
                        ...lastItem,
                        count: (lastItem.count || 1) + 1,
                        time: new Date().toLocaleTimeString(),
                        isLowStock: parseInt(formData.currentStock || '0') + 1 <= parseInt(formData.lowStockThreshold || '10')
                    }, ...prev.slice(1)];
                }
                // Add new item if it's the first scan of this session for this product
                return [{
                    name: formData.name || 'Unknown Item',
                    time: new Date().toLocaleTimeString(),
                    status: 'updated' as const,
                    count: 1,
                    isLowStock: parseInt(formData.currentStock || '0') + 1 <= parseInt(formData.lowStockThreshold || '10')
                }, ...prev];
            });

            console.log('➕ Stock incremented:', {
                productName: formData.name,
                newStock: parseInt(formData.currentStock || '0') + 1,
                isEditingExisting,
                barcode
            });

            return;
        }

        // Case 2: Currently loading THIS item - Race condition handling
        // If we are already fetching this barcode, just queue the increment
        if (loading && processingBarcode.current === barcode) {
            pendingIncrements.current += 1;
            playBeep();
            return;
        }

        // Case 3: New scan (or different item) - Start Fetch
        processingBarcode.current = barcode;
        pendingIncrements.current = 0;
        setLoading(true);

        try {
            const existingProduct = await findProductByBarcode(orgId, barcode);
            playBeep();

            // Calculate total scans (1 initial + any that happened while waiting)
            const totalNewScans = 1 + pendingIncrements.current;

            if (existingProduct) {
                // Found product - Load it AND increment stock by total scans
                const initialStock = existingProduct.currentStock;
                const newStock = initialStock + totalNewScans;

                setFormData({
                    name: existingProduct.name,
                    sku: existingProduct.sku,
                    barcode: existingProduct.barcode || '',
                    category: existingProduct.category,
                    costPrice: existingProduct.costPrice.toString(),
                    sellingPrice: existingProduct.sellingPrice.toString(),
                    currentStock: newStock.toString(),
                    lowStockThreshold: existingProduct.lowStockThreshold.toString(),
                });

                setIsEditingExisting(true);
                setFoundProductId(existingProduct.id);
                setSuggestions([]);
                setShowSuggestions(false);
                setLastScanned(barcode);

                console.log('📦 Existing product loaded:', {
                    productName: existingProduct.name,
                    productId: existingProduct.id,
                    isEditingExisting: true,
                    newStock,
                    scans: totalNewScans
                });

                // Add to history - with grouping logic
                setScanHistory(prev => {
                    const lastItem = prev[0];
                    // Check if the last item in history is the same product
                    if (lastItem && lastItem.name === existingProduct.name && lastItem.status === 'updated') {
                        // Increment count of existing item
                        return [{
                            ...lastItem,
                            count: (lastItem.count || 1) + totalNewScans,
                            time: new Date().toLocaleTimeString(),
                            isLowStock: newStock <= existingProduct.lowStockThreshold
                        }, ...prev.slice(1)];
                    }
                    // Add new item
                    return [{
                        name: existingProduct.name,
                        time: new Date().toLocaleTimeString(),
                        status: 'updated' as const,
                        count: totalNewScans,
                        isLowStock: newStock <= existingProduct.lowStockThreshold
                    }, ...prev];
                });
            } else {
                // New product - Auto-generate all required fields for instant save
                const autoGeneratedName = `Item ${barcode}`;
                const autoSKU = `SKU-${barcode}`;

                setFormData({
                    name: autoGeneratedName,  // Auto-generated, user can edit
                    sku: autoSKU,              // Auto-generated from barcode
                    barcode: barcode,
                    category: 'Other',         // Default category
                    costPrice: '0',            // Default to 0, user can edit
                    sellingPrice: '0',         // Default to 0, user can edit
                    currentStock: totalNewScans.toString(), // Start with scan count
                    lowStockThreshold: '10',   // Sensible default
                });
                setIsEditingExisting(false);
                setFoundProductId(undefined); // Reset found ID for new product
                setLastScanned(barcode);

                console.log('🆕 New product auto-generated:', {
                    barcode,
                    name: autoGeneratedName,
                    isEditingExisting: false,
                    initialStock: totalNewScans
                });

                // Add to history
                setScanHistory(prev => [{
                    name: autoGeneratedName,
                    time: new Date().toLocaleTimeString(),
                    status: 'new' as const,
                    count: totalNewScans,
                    isLowStock: false
                }, ...prev]);
            }
        } catch (error) {
            console.error('Error looking up barcode:', error);
        } finally {
            setLoading(false);
            processingBarcode.current = null;
            pendingIncrements.current = 0;
        }
    };

    // Handle name search
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData(prev => ({ ...prev, name }));

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!name.trim() || name.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            if (!orgId) return;
            try {
                const results = await searchProductsByName(orgId, name);
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const fillFormWithProduct = (prod: Product) => {
        setFormData({
            name: prod.name,
            sku: prod.sku,
            barcode: prod.barcode || '',
            category: prod.category,
            costPrice: prod.costPrice.toString(),
            sellingPrice: prod.sellingPrice.toString(),
            currentStock: prod.currentStock.toString(),
            lowStockThreshold: prod.lowStockThreshold.toString(),
        });
        setIsEditingExisting(true);
        setFoundProductId(prod.id); // Track the ID of the product we found
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleBarcodeScan = (scannedBarcode: string) => {
        handleBarcodeLookup(scannedBarcode);
        // Don't close scanner in embedded mode
        // setShowScanner(false); 
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Product name is required';
        }
        if (!formData.sku.trim()) {
            newErrors.sku = 'SKU is required';
        }
        if (!formData.barcode.trim()) {
            newErrors.barcode = 'Barcode is required';
        }
        if (!formData.category) {
            newErrors.category = 'Category is required';
        }
        // Allow 0 for prices - that's okay for quick barcode entry
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

        if (!orgId) {
            setErrors({ submit: 'Organization ID not found' });
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
                orgId,
            };

            // Determine mode and ID
            const mode = isEditingExisting ? 'update' : 'create';
            // Use foundProductId if we switched products via scan, otherwise fall back to props.product.id
            const targetId = foundProductId || product?.id;

            console.log('📤 Submitting Form:', {
                mode,
                foundProductId,
                propProductId: product?.id,
                targetId,
                formDataName: formData.name,
                currentStock: formData.currentStock,
                originalStock: product?.currentStock
            });

            await onSave(productData, mode, targetId);

            playBeep();

            // Add to history
            const status: 'new' | 'updated' = isEditingExisting ? 'updated' : 'new';
            setScanHistory(prev => [{
                name: formData.name,
                time: new Date().toLocaleTimeString(),
                status: status
            }, ...prev].slice(0, 5));

            // If scanner is open, we assume continuous mode
            if (showScanner) {
                // Reset form but keep barcode scanner active
                console.log('🔄 Resetting form for next scan (continuous mode)');
                setFormData({
                    name: '',
                    sku: '',
                    barcode: '',
                    category: '',
                    costPrice: '',
                    sellingPrice: '',
                    currentStock: '0',
                    lowStockThreshold: '10',
                });
                setIsEditingExisting(false);
                setFoundProductId(undefined);
                setLastScanned(null);
            } else {
                // Modal mode - form will be closed by parent, but log success
                console.log('✅ Product saved successfully (modal mode)');
            }

        } catch (error) {
            console.error('❌ Error submitting form:', error);
            setErrors({ submit: `Failed to save product. ${error instanceof Error ? error.message : 'Please try again.'}` });
        } finally {
            setLoading(false);
        }
    };

    // Auto-save handler for Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission
            handleSubmit(e as any);
        }
    };

    return (
        <div className="flex flex-col gap-6 lg:flex-row">
            {/* Main Form Area */}
            <div className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Scanner Toggle - Moved here since Modal has title */}
                    <div className="flex justify-end">
                        <label className={`relative inline-flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2 transition-all ${showScanner ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}>
                            <input
                                type="checkbox"
                                checked={showScanner}
                                onChange={(e) => setShowScanner(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className={`flex h-5 w-9 items-center rounded-full p-1 transition-colors ${showScanner ? 'bg-blue-600' : 'bg-neutral-300'}`}>
                                <div className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${showScanner ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className={`text-sm font-medium ${showScanner ? 'text-blue-700' : 'text-neutral-600'}`}>
                                Camera Scanner
                            </span>
                        </label>
                    </div>

                    {/* Basic Details Section */}
                    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Basic Details</h4>
                        </div>
                        <div className="p-6 grid gap-6">
                            <div className="relative">
                                <Input
                                    label="Product Name"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    onKeyDown={handleKeyDown}
                                    error={errors.name}
                                    placeholder="Type to search or enter name..."
                                    autoComplete="off"
                                    className="text-lg font-medium"
                                />
                                {/* Suggestions Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                        {suggestions.map((prod) => (
                                            <button
                                                key={prod.id}
                                                type="button"
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                                onClick={() => fillFormWithProduct(prod)}
                                            >
                                                <div className="font-medium text-gray-900">{prod.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    SKU: {prod.sku} • Stock: {prod.currentStock}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <Input
                                    label="Barcode"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Scan or type..."
                                    icon={
                                        <button
                                            type="button"
                                            onClick={() => setShowScanner(!showScanner)}
                                            className="text-neutral-400 hover:text-blue-600"
                                            title="Toggle Scanner"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                            </svg>
                                        </button>
                                    }
                                />
                                <Input
                                    label="SKU"
                                    value={formData.sku}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                                    onKeyDown={handleKeyDown}
                                    error={errors.sku}
                                    placeholder="Stock Keeping Unit"
                                />
                            </div>

                            <Select
                                label="Category"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                error={errors.category}
                            >
                                <option value="">Select Category</option>
                                {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Pricing & Inventory Section */}
                    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Pricing & Inventory</h4>
                        </div>
                        <div className="p-6 grid gap-6">
                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    label="Cost Price"
                                    type="number"
                                    value={formData.costPrice}
                                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                                    onKeyDown={handleKeyDown}
                                    error={errors.costPrice}
                                    min="0"
                                    step="0.01"
                                    icon={<span className="text-neutral-500">₹</span>}
                                />
                                <Input
                                    label="Selling Price"
                                    type="number"
                                    value={formData.sellingPrice}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                                    onKeyDown={handleKeyDown}
                                    error={errors.sellingPrice}
                                    min="0"
                                    step="0.01"
                                    icon={<span className="text-neutral-500">₹</span>}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="relative">
                                    <Input
                                        label="Current Stock"
                                        type="number"
                                        value={formData.currentStock}
                                        onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                                        onKeyDown={handleKeyDown}
                                        error={errors.currentStock}
                                        min="0"
                                    />
                                    {/* Show session scan count - even for first scan */}
                                    {scanHistory.length > 0 && scanHistory[0]?.count && (
                                        <div className="absolute -right-2 -top-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg ring-2 ring-white animate-pulse">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span>+{scanHistory[0].count}</span>
                                        </div>
                                    )}
                                </div>
                                <Input
                                    label="Low Stock Alert"
                                    type="number"
                                    value={formData.lowStockThreshold}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                                    onKeyDown={handleKeyDown}
                                    error={errors.lowStockThreshold}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {errors.submit && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                            {errors.submit}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={loading}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                        >
                            {loading ? 'Saving...' : (isEditingExisting ? (scanHistory.length > 0 && scanHistory[0]?.status === 'updated' ? `Add Stock (+${scanHistory[0]?.count || 0})` : 'Update Product') : 'Create Product')}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Side Scanner Panel - Better Integration */}
            {showScanner && (
                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="sticky top-4 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="border-b border-neutral-100 bg-neutral-50/50 px-4 py-3">
                            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Live Scanner
                            </h4>
                        </div>

                        <div className="bg-black">
                            <BarcodeScanner
                                onScan={handleBarcodeScan}
                                variant="embedded"
                                autoStart={true}
                            />
                        </div>

                        <div className="p-4">
                            <div className="mb-2 flex items-center justify-between border-b border-neutral-100 pb-2">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Session Scans</h5>
                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                                    {scanHistory.length}
                                </span>
                            </div>

                            <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {scanHistory.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-neutral-400 italic">
                                        Ready to scan...
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {scanHistory.map((item, i) => (
                                            <div key={i} className={`flex items-center justify-between rounded border p-2 text-xs shadow-sm transition-all ${item.isLowStock ? 'border-red-200 bg-red-50' : 'border-neutral-100 bg-white hover:border-blue-100'
                                                }`}>
                                                <div className="flex flex-col overflow-hidden">
                                                    <div className="flex items-center gap-1">
                                                        <span className={`truncate font-medium ${item.isLowStock ? 'text-red-700' : 'text-neutral-900'}`} title={item.name}>
                                                            {item.name || 'Unknown Item'}
                                                        </span>
                                                        {item.count && item.count > 1 && (
                                                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] font-bold text-white">
                                                                {item.count}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-neutral-400">{item.time}</span>
                                                        {item.isLowStock && (
                                                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-600">
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                                Low Stock
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${item.status === 'new'
                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    }`}>
                                                    {item.status === 'new' ? 'New' : '+1 Stock'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
