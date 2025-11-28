'use client';

import { useState, useRef, useEffect } from 'react';
import { findProductByBarcode, createProduct, adjustStock } from '@/lib/firestore/products';
import { Product } from '@/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import BarcodeScanner from './BarcodeScanner';

interface ScannedItem {
    barcode: string;
    productId?: string;
    name: string;
    quantity: number;
    unitCost: number;
    isNew: boolean;
    editing?: boolean;
}

interface RapidStockInProps {
    orgId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RapidStockIn({ orgId, onClose, onSuccess }: RapidStockInProps) {
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [pendingBarcode, setPendingBarcode] = useState('');
    const [quickAddData, setQuickAddData] = useState({ name: '', unitCost: '', quantity: '1' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, [showScanner, showQuickAdd]);

    const handleBarcodeScanned = async (barcode: string) => {
        if (!barcode.trim()) return;

        setLoading(true);

        try {
            // Check if already in scanned list
            const existingIndex = scannedItems.findIndex(item => item.barcode === barcode);

            if (existingIndex >= 0) {
                // Increment quantity
                const updated = [...scannedItems];
                updated[existingIndex].quantity += 1;
                setScannedItems(updated);
                setBarcodeInput('');
                setLoading(false);
                return;
            }

            // Check if product exists in database
            const product = await findProductByBarcode(orgId, barcode);

            if (product) {
                // Add existing product
                setScannedItems([...scannedItems, {
                    barcode,
                    productId: product.id,
                    name: product.name,
                    quantity: 1,
                    unitCost: product.costPrice,
                    isNew: false
                }]);
                setBarcodeInput('');
            } else {
                // Show quick add form for new product
                setPendingBarcode(barcode);
                setQuickAddData({ name: '', unitCost: '', quantity: '1' });
                setShowQuickAdd(true);
            }
        } catch (error) {
            console.error('Error processing barcode:', error);
            alert('Failed to process barcode');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdd = () => {
        const cost = parseFloat(quickAddData.unitCost);
        const qty = parseInt(quickAddData.quantity);

        if (isNaN(cost) || cost <= 0) {
            alert('Please enter a valid unit cost');
            return;
        }

        if (isNaN(qty) || qty <= 0) {
            alert('Please enter a valid quantity');
            return;
        }

        setScannedItems([...scannedItems, {
            barcode: pendingBarcode,
            name: quickAddData.name.trim() || `Product ${pendingBarcode}`,
            quantity: qty,
            unitCost: cost,
            isNew: true
        }]);

        setShowQuickAdd(false);
        setPendingBarcode('');
        setBarcodeInput('');
    };

    const handleUpdateItem = (index: number, field: 'name' | 'quantity' | 'unitCost', value: string | number) => {
        const updated = [...scannedItems];
        if (field === 'quantity') {
            updated[index].quantity = typeof value === 'number' ? value : parseInt(value as string) || 1;
        } else if (field === 'unitCost') {
            updated[index].unitCost = typeof value === 'number' ? value : parseFloat(value as string) || 0;
        } else {
            updated[index].name = value as string;
        }
        setScannedItems(updated);
    };

    const handleRemoveItem = (index: number) => {
        setScannedItems(scannedItems.filter((_, i) => i !== index));
    };

    const handleSaveAll = async () => {
        if (scannedItems.length === 0) {
            alert('No items to save');
            return;
        }

        setSaving(true);

        try {
            for (const item of scannedItems) {
                if (item.isNew) {
                    // Create new product
                    await createProduct(orgId, {
                        name: item.name,
                        barcode: item.barcode,
                        sku: item.barcode,
                        category: 'Other',
                        costPrice: item.unitCost,
                        sellingPrice: item.unitCost * 1.2, // Default 20% markup
                        currentStock: item.quantity,
                        lowStockThreshold: 10,
                        orgId
                    });
                } else {
                    // Add stock to existing product
                    await adjustStock(orgId, item.productId!, {
                        type: 'IN',
                        quantity: item.quantity,
                        unitCost: item.unitCost,
                        reason: 'Rapid stock-in via barcode scanner'
                    });
                }
            }

            alert(`Successfully processed ${scannedItems.length} items!`);
            setScannedItems([]);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving items:', error);
            alert('Failed to save some items. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const totalItems = scannedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = scannedItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg bg-white">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 p-6">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900">Rapid Stock-In</h2>
                        <p className="mt-1 text-sm text-neutral-600">Scan multiple items quickly</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scanner Input */}
                <div className="border-b border-neutral-200 p-6">
                    <div className="flex gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleBarcodeScanned(barcodeInput);
                                }
                            }}
                            placeholder="Scan or type barcode..."
                            className="flex-1 rounded-lg border border-neutral-300 px-4 py-3 text-lg text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none"
                            disabled={loading || showQuickAdd}
                        />
                        <Button
                            onClick={() => handleBarcodeScanned(barcodeInput)}
                            disabled={!barcodeInput.trim() || loading || showQuickAdd}
                            isLoading={loading}
                        >
                            Add
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setShowScanner(true)}
                            disabled={showQuickAdd}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </Button>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                        💡 Scan same barcode multiple times to auto-increment quantity
                    </p>
                </div>

                {/* Quick Add Form */}
                {showQuickAdd && (
                    <div className="border-b border-neutral-200 bg-blue-50 p-6">
                        <h3 className="mb-4 font-semibold text-neutral-900">New Product: {pendingBarcode}</h3>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Input
                                label="Product Name (Optional)"
                                value={quickAddData.name}
                                onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleQuickAdd();
                                    }
                                }}
                                placeholder="Leave empty for auto-name"
                            />
                            <Input
                                label="Unit Cost (₹) *"
                                type="number"
                                step="0.01"
                                value={quickAddData.unitCost}
                                onChange={(e) => setQuickAddData({ ...quickAddData, unitCost: e.target.value })}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleQuickAdd();
                                    }
                                }}
                                required
                                autoFocus
                            />
                            <Input
                                label="Quantity *"
                                type="number"
                                value={quickAddData.quantity}
                                onChange={(e) => setQuickAddData({ ...quickAddData, quantity: e.target.value })}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleQuickAdd();
                                    }
                                }}
                                required
                            />
                        </div>
                        <div className="mt-4 flex gap-3">
                            <Button onClick={handleQuickAdd}>Add to List</Button>
                            <Button variant="ghost" onClick={() => {
                                setShowQuickAdd(false);
                                setPendingBarcode('');
                            }}>
                                Cancel
                            </Button>
                        </div>
                        <p className="mt-2 text-xs text-neutral-500">
                            💡 Press Enter to quickly add item
                        </p>
                    </div>
                )}

                {/* Scanned Items List */}
                <div className="max-h-96 overflow-y-auto p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-neutral-900">
                            Scanned Items ({scannedItems.length})
                        </h3>
                        {scannedItems.length > 0 && (
                            <button
                                onClick={() => setScannedItems([])}
                                className="text-sm text-red-600 hover:text-red-700"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {scannedItems.length === 0 ? (
                        <div className="py-12 text-center text-neutral-500">
                            <p>No items scanned yet</p>
                            <p className="mt-1 text-sm">Start scanning barcodes to add items</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {scannedItems.map((item, index) => (
                                <div key={index} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                                                    className="flex-1 rounded border-none bg-transparent px-2 py-1 font-medium text-neutral-900 placeholder:text-neutral-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Product name"
                                                />
                                                {item.isNew && (
                                                    <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-neutral-600">Barcode: {item.barcode}</p>
                                            <div className="mt-3 flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-neutral-600">Qty:</span>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                                                        className="w-20 rounded border border-neutral-300 px-2 py-1 text-center text-neutral-900 focus:border-blue-500 focus:outline-none"
                                                        min="1"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-neutral-600">Price:</span>
                                                    <input
                                                        type="number"
                                                        value={item.unitCost}
                                                        onChange={(e) => handleUpdateItem(index, 'unitCost', e.target.value)}
                                                        className="w-24 rounded border border-neutral-300 px-2 py-1 text-neutral-900 focus:border-blue-500 focus:outline-none"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="text-sm font-semibold text-neutral-900">
                                                    Total: ₹{(item.quantity * item.unitCost).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(index)}
                                            className="ml-4 text-red-600 hover:text-red-700"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-neutral-200 bg-neutral-50 p-6">
                    <div className="mb-4 flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Total Items:</span>
                        <span className="font-semibold text-neutral-900">{totalItems}</span>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-neutral-600">Total Cost:</span>
                        <span className="text-xl font-bold text-neutral-900">₹{totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleSaveAll}
                            disabled={scannedItems.length === 0 || saving}
                            isLoading={saving}
                            className="flex-1"
                        >
                            Save All Stock
                        </Button>
                        <Button variant="ghost" onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                    </div>
                </div>

                {/* Barcode Scanner Modal */}
                {showScanner && (
                    <BarcodeScanner
                        onScan={(barcode) => {
                            setShowScanner(false);
                            setBarcodeInput(barcode);
                            handleBarcodeScanned(barcode);
                        }}
                        onClose={() => setShowScanner(false)}
                    />
                )}
            </div>
        </div>
    );
}
