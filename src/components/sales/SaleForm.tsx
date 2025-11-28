'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product, SaleItem, Customer } from '@/types';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getCustomers } from '@/lib/firestore/customers';

interface SaleFormProps {
    onSubmit: (data: {
        items: SaleItem[];
        subTotal: number;
        discount: number;
        tax: number;
        grandTotal: number;
        totalCost: number;
        paymentMode: 'cash' | 'card' | 'upi' | 'credit' | 'other';
        customerId?: string;
        customerName?: string;
    }) => Promise<void>;
    onCancel: () => void;
}

export function SaleForm({ onSubmit, onCancel }: SaleFormProps) {
    const { orgId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [customPrice, setCustomPrice] = useState('');

    const [lineItems, setLineItems] = useState<SaleItem[]>([]);
    const [discount, setDiscount] = useState('0');
    const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
    const [tax, setTax] = useState('0');
    const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi' | 'credit' | 'other'>('cash');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [customerName, setCustomerName] = useState(''); // Fallback for non-registered customers

    // Load products
    useEffect(() => {
        if (!orgId) return;

        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('orgId', '==', orgId), orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const productsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                })) as Product[];

                setProducts(productsData.filter(p => p.currentStock > 0)); // Only show in-stock products
            },
            (error) => {
                console.error("Error fetching products in SaleForm:", error);
            }
        );

        return () => unsubscribe();
    }, [orgId]);

    // Load customers
    useEffect(() => {
        if (!orgId) return;
        getCustomers(orgId).then(setCustomers).catch(console.error);
    }, [orgId]);

    const addLineItem = () => {
        if (!selectedProductId) {
            setErrors({ product: 'Please select a product' });
            return;
        }

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        const qty = parseInt(quantity);
        if (qty <= 0 || isNaN(qty)) {
            setErrors({ quantity: 'Quantity must be greater than 0' });
            return;
        }

        if (qty > product.currentStock) {
            setErrors({ quantity: `Only ${product.currentStock} units available` });
            return;
        }

        const price = customPrice ? parseFloat(customPrice) : product.sellingPrice;
        if (price < 0 || isNaN(price)) {
            setErrors({ price: 'Invalid price' });
            return;
        }

        const newItem: SaleItem = {
            productId: product.id!,
            productName: product.name || 'Unknown Product',
            quantity: qty,
            sellingPrice: price,
            costPrice: product.costPrice,
            lineTotal: qty * price,
            lineCostTotal: qty * product.costPrice,
        };

        setLineItems([...lineItems, newItem]);
        setSelectedProductId('');
        setQuantity('1');
        setCustomPrice('');
        setErrors({});
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    // Calculate totals
    const subTotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalCost = lineItems.reduce((sum, item) => sum + item.lineCostTotal, 0);

    const discountAmount = discountType === 'percent'
        ? (subTotal * parseFloat(discount || '0')) / 100
        : parseFloat(discount || '0');

    const taxableAmount = subTotal - discountAmount;
    const taxAmount = (taxableAmount * parseFloat(tax || '0')) / 100;
    const grandTotal = taxableAmount + taxAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (lineItems.length === 0) {
            setErrors({ submit: 'Please add at least one product' });
            return;
        }

        if (paymentMode === 'credit' && !selectedCustomerId) {
            setErrors({ customer: 'Customer is required for credit sales' });
            return;
        }

        setLoading(true);
        try {
            // Get customer name if selected from list, otherwise use manual input
            let finalCustomerName = customerName;
            if (selectedCustomerId) {
                const customer = customers.find(c => c.id === selectedCustomerId);
                if (customer) finalCustomerName = customer.name;
            }

            await onSubmit({
                items: lineItems,
                subTotal,
                discount: discountAmount,
                tax: taxAmount,
                grandTotal,
                totalCost,
                paymentMode,
                customerId: selectedCustomerId || undefined,
                customerName: finalCustomerName.trim() || undefined,
            });
        } catch (error: any) {
            console.error('Error creating sale:', error);
            setErrors({ submit: error.message || 'Failed to create sale. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div className="rounded-lg border border-neutral-200 p-4">
                <h3 className="mb-4 font-semibold text-neutral-900">Add Products</h3>

                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                        <Select
                            label="Product"
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            error={errors.product}
                            disabled={loading}
                        >
                            <option value="">Select a product</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} (Stock: {product.currentStock})
                                </option>
                            ))}
                        </Select>
                    </div>

                    <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        error={errors.quantity}
                        disabled={loading}
                    />

                    <Input
                        label="Price (₹)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        helperText={selectedProductId && products.find(p => p.id === selectedProductId)
                            ? `Default: ₹${products.find(p => p.id === selectedProductId)!.sellingPrice}`
                            : undefined}
                        error={errors.price}
                        disabled={loading}
                    />
                </div>

                <div className="mt-4">
                    <Button type="button" variant="secondary" onClick={addLineItem} disabled={loading}>
                        + Add to Cart
                    </Button>
                </div>
            </div>

            {/* Line Items */}
            {lineItems.length > 0 && (
                <div className="rounded-lg border border-neutral-200 p-4">
                    <h3 className="mb-4 font-semibold text-neutral-900">Cart Items</h3>

                    <div className="space-y-2">
                        {lineItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
                                <div className="flex-1">
                                    <div className="font-medium text-neutral-900">{item.productName}</div>
                                    <div className="text-sm text-neutral-600">
                                        {item.quantity} × ₹{item.sellingPrice.toFixed(2)} = ₹{item.lineTotal.toFixed(2)}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLineItem(index)}
                                    disabled={loading}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Totals & Payment */}
            <div className="rounded-lg border border-neutral-200 p-4">
                <h3 className="mb-4 font-semibold text-neutral-900">Payment Details</h3>

                <div className="mb-4 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Subtotal:</span>
                        <span className="font-medium">₹{subTotal.toFixed(2)}</span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex gap-2">
                            <Input
                                label="Discount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                disabled={loading}
                            />
                            <Select
                                label="Type"
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value as any)}
                                disabled={loading}
                            >
                                <option value="amount">₹</option>
                                <option value="percent">%</option>
                            </Select>
                        </div>

                        <Input
                            label="Tax (%)"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={tax}
                            onChange={(e) => setTax(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex justify-between border-t border-neutral-200 pt-3 text-lg font-semibold">
                        <span>Grand Total:</span>
                        <span>₹{grandTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                        label="Payment Mode"
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as any)}
                        required
                        disabled={loading}
                    >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="credit">Credit (Udhaar)</option>
                        <option value="other">Other</option>
                    </Select>

                    {/* Customer Selection */}
                    <div>
                        <Select
                            label="Select Customer"
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            error={errors.customer}
                            disabled={loading}
                        >
                            <option value="">-- Walk-in Customer --</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.phone})
                                </option>
                            ))}
                        </Select>

                        {/* Fallback for manual name if no customer selected */}
                        {!selectedCustomerId && (
                            <div className="mt-2">
                                <Input
                                    placeholder="Or enter name manually..."
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {errors.submit && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {errors.submit}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={loading}>
                    Complete Sale
                </Button>
            </div>
        </form>
    );
}
