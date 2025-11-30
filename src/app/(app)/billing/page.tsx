'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product, SaleItem, Customer } from '@/types';
import { ProductSearch } from '@/components/billing/ProductSearch';
import { BillingCart } from '@/components/billing/BillingCart';
import { ReceiptTemplate } from '@/components/billing/ReceiptTemplate';
import { recordSale } from '@/lib/firestore/sales';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Printer, RefreshCw } from 'lucide-react';

import { BillSuccessModal } from '@/components/billing/BillSuccessModal';

export default function BillingPage() {
    const { user, orgId, orgName } = useAuth();
    // Extend SaleItem locally to include maxStock for validation
    interface CartItem extends SaleItem {
        maxStock: number;
    }

    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Fetch customers for dropdown
    useEffect(() => {
        if (!orgId) return;
        const fetchCustomers = async () => {
            const q = query(collection(db, 'customers'), where('orgId', '==', orgId), orderBy('name'));
            const snapshot = await getDocs(q);
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
        };
        fetchCustomers();
    }, [orgId]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);

            if (existing) {
                // Check stock limit
                if (existing.quantity + 1 > existing.maxStock) {
                    alert(`Cannot add more. Only ${existing.maxStock} in stock.`);
                    return prev;
                }

                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.sellingPrice, lineCostTotal: (item.quantity + 1) * item.costPrice }
                        : item
                );
            }

            // Check if product has stock
            if (product.currentStock < 1) {
                alert('Out of stock!');
                return prev;
            }

            return [...prev, {
                productId: product.id!,
                productName: product.name,
                quantity: 1,
                sellingPrice: product.sellingPrice,
                costPrice: product.costPrice,
                lineTotal: product.sellingPrice,
                lineCostTotal: product.costPrice,
                maxStock: product.currentStock
            }];
        });
    };

    const updateQuantity = (productId: string, newQty: number) => {
        if (newQty < 1) return;

        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                // Check stock limit
                if (newQty > item.maxStock) {
                    alert(`Cannot set quantity to ${newQty}. Only ${item.maxStock} in stock.`);
                    return item;
                }
                return { ...item, quantity: newQty, lineTotal: newQty * item.sellingPrice, lineCostTotal: newQty * item.costPrice };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const handleCheckout = async (paymentMode: 'cash' | 'card' | 'upi' | 'credit') => {
        if (!orgId || cart.length === 0) return;
        setIsProcessing(true);

        try {
            const subTotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
            const totalCost = cart.reduce((sum, item) => sum + item.lineCostTotal, 0);

            const saleData = {
                items: cart,
                subTotal,
                discount: 0,
                tax: 0,
                grandTotal: subTotal,
                totalCost,
                paymentMode,
                customerId: selectedCustomer?.id,
                customerName: selectedCustomer?.name
            };

            const saleId = await recordSale(orgId, saleData);

            // Prepare receipt data
            setLastSale({
                id: saleId,
                invoiceNumber: 'Generating...', // In real app, get from response or wait
                ...saleData,
                createdAt: new Date()
            });

            // Show Success Modal instead of auto-print/clear
            setShowSuccessModal(true);

        } catch (error) {
            console.error("Checkout failed", error);
            alert("Checkout failed: " + (error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const [isInitialized, setIsInitialized] = useState(false);

    // Load persisted state on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('billing_cart');
        const savedCustomer = localStorage.getItem('billing_customer');

        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse saved cart", e);
            }
        }

        if (savedCustomer) {
            try {
                setSelectedCustomer(JSON.parse(savedCustomer));
            } catch (e) {
                console.error("Failed to parse saved customer", e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save state to localStorage whenever it changes, BUT ONLY after initialization
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem('billing_cart', JSON.stringify(cart));
    }, [cart, isInitialized]);

    useEffect(() => {
        if (!isInitialized) return;
        if (selectedCustomer) {
            localStorage.setItem('billing_customer', JSON.stringify(selectedCustomer));
        } else {
            localStorage.removeItem('billing_customer');
        }
    }, [selectedCustomer, isInitialized]);

    const handleReset = () => {
        if (confirm('Are you sure you want to reset the billing page? This will clear the cart and selected customer.')) {
            setCart([]);
            setSelectedCustomer(null);
            localStorage.removeItem('billing_cart');
            localStorage.removeItem('billing_customer');
        }
    };

    // ... (rest of the component)

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        setCart([]);
        setSelectedCustomer(null);
        setLastSale(null);
        // Clear storage on successful completion
        localStorage.removeItem('billing_cart');
        localStorage.removeItem('billing_customer');
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-4 p-4 bg-neutral-50">
            {/* Left Side: Search & Product Entry */}
            <div className="w-full md:w-2/3 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-900">Add Items</h2>
                        <button
                            onClick={handleReset}
                            className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                            Reset Billing
                        </button>
                    </div>
                    <ProductSearch onProductSelect={addToCart} orgId={orgId || ''} />
                </div>

                {/* Quick Actions / Common Products could go here */}
                <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-neutral-200 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-900">Cart Items ({cart.length})</h2>
                        <button onClick={() => setCart([])} className="text-red-500 text-sm hover:underline">Clear Cart</button>
                    </div>
                    <BillingCart
                        items={cart}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                    />
                </div>
            </div>

            {/* Right Side: Checkout & Totals */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 h-full flex flex-col">
                    <h2 className="text-xl font-bold mb-6 text-neutral-900">Checkout</h2>

                    {/* Customer Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Customer (Optional)</label>
                        <select
                            className="w-full p-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                            onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                            value={selectedCustomer?.id || ''}
                        >
                            <option value="">Walk-in Customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                            ))}
                        </select>
                    </div>

                    {/* Totals */}
                    <div className="space-y-3 mb-6 border-t border-b border-neutral-100 py-4">
                        <div className="flex justify-between text-neutral-600">
                            <span>Subtotal</span>
                            <span>₹{cart.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                            <span>Tax (0%)</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-neutral-900 pt-2">
                            <span>Total</span>
                            <span>₹{cart.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button
                            onClick={() => handleCheckout('cash')}
                            disabled={cart.length === 0 || isProcessing}
                            className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                            Cash
                        </button>
                        <button
                            onClick={() => handleCheckout('upi')}
                            disabled={cart.length === 0 || isProcessing}
                            className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                        >
                            UPI
                        </button>
                        <button
                            onClick={() => handleCheckout('card')}
                            disabled={cart.length === 0 || isProcessing}
                            className="bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
                        >
                            Card
                        </button>
                        <button
                            onClick={() => handleCheckout('credit')}
                            disabled={cart.length === 0 || isProcessing || !selectedCustomer}
                            className="bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
                            title={!selectedCustomer ? "Select a customer for credit" : ""}
                        >
                            Credit
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && lastSale && (
                <BillSuccessModal
                    sale={lastSale}
                    onPrint={handlePrint}
                    onClose={handleCloseModal}
                />
            )}

            {/* Hidden Receipt for Printing - ReceiptTemplate handles its own display logic */}
            <div>
                {lastSale && (
                    <ReceiptTemplate sale={lastSale} orgName={orgName || 'My Shop'} />
                )}
            </div>
        </div>
    );
}
