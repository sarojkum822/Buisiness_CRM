'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product, SaleItem, Customer } from '@/types';
import { ProductSearch } from '@/components/billing/ProductSearch';
import { BillingCart } from '@/components/billing/BillingCart';
import { ReceiptTemplate } from '@/components/billing/ReceiptTemplate';
import { recordSale } from '@/lib/firestore/sales';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Printer, RefreshCw } from 'lucide-react';

import { BillSuccessModal } from '@/components/billing/BillSuccessModal';
import { CustomerSelectionModal } from '@/components/billing/CustomerSelectionModal';
import { PaymentModal } from '@/components/billing/PaymentModal';
import { useScanDetection } from '@/hooks/useScanDetection';
import { playBeep } from '@/lib/sound';
import { Wallet } from 'lucide-react';

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
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [gstNumber, setGstNumber] = useState('');

    // Fetch Organization Details (GST)
    useEffect(() => {
        if (!orgId) return;
        const fetchOrgDetails = async () => {
            try {
                const docRef = doc(db, 'organizations', orgId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setGstNumber(snap.data().gstNumber || '');
                }
            } catch (error) {
                console.error("Error fetching org details:", error);
            }
        };
        fetchOrgDetails();
    }, [orgId]);

    // Fetch customers for dropdown
    useEffect(() => {
        if (!user?.email) return;
        const fetchCustomers = async () => {
            // Client-side sorting: Remove orderBy
            const q = query(collection(db, 'customers'), where('orgId', '==', user.email));
            const snapshot = await getDocs(q);
            const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));

            // Sort by name client-side
            customersData.sort((a, b) => a.name.localeCompare(b.name));

            setCustomers(customersData);
        };
        fetchCustomers();
    }, [user?.email]);

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

    // Placeholder for findProductByBarcode - assuming it's a new utility function
    // This function would typically query your products collection by barcode.
    const findProductByBarcode = async (orgId: string, barcode: string): Promise<Product | null> => {
        try {
            const q = query(collection(db, 'products'), where('orgId', '==', orgId), where('barcode', '==', barcode));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() } as Product;
            }
            return null;
        } catch (error) {
            console.error("Error finding product by barcode:", error);
            return null;
        }
    };

    const handleScan = async (barcode: string) => {
        if (!user?.email) return;
        try {
            const product = await findProductByBarcode(user.email, barcode);
            if (product) {
                addToCart(product);
                playBeep('success');
            } else {
                playBeep('error');
                // alert(`Product with barcode ${barcode} not found.`);
                // For remote scanner, maybe just console log or show a toast to avoid blocking alerts
                console.log(`Product with barcode ${barcode} not found.`);
            }
        } catch (error) {
            console.error("Scan error:", error);
        }
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

    // Refresh customers after payment
    const refreshCustomers = async () => {
        if (!user?.email) return;
        // Client-side sorting: Remove orderBy
        const q = query(collection(db, 'customers'), where('orgId', '==', user.email));
        const snapshot = await getDocs(q);
        const updatedCustomers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));

        // Sort by name client-side
        updatedCustomers.sort((a, b) => a.name.localeCompare(b.name));

        setCustomers(updatedCustomers);

        // Update selected customer if exists
        if (selectedCustomer) {
            const updated = updatedCustomers.find(c => c.id === selectedCustomer.id);
            if (updated) setSelectedCustomer(updated);
        }
    };

    const handleCheckout = async (paymentMode: 'cash' | 'card' | 'upi' | 'credit') => {
        if (!user?.email || cart.length === 0) return;

        // Validate Credit Sale
        if (paymentMode === 'credit' && !selectedCustomer) {
            setShowCustomerModal(true);
            return;
        }

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
                totalPaid: paymentMode === 'credit' ? 0 : subTotal, // Track paid amount
                paymentMode,
                customerId: selectedCustomer?.id || null,
                customerName: selectedCustomer?.name || null,
                customerPhone: selectedCustomer?.phone || null
            };

            const saleId = await recordSale(user.email, saleData);

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

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowCustomerModal(false);
        // Optional: Auto-trigger credit checkout?
        // For now, let's just select the customer so the user can click Credit again.
        // Actually, better UX: if modal was opened via Credit click, maybe we should proceed?
        // But to keep it simple and safe: Select customer -> User clicks Credit again.
        // Wait, user said "popup vanishing... so not working".
        // Let's make it seamless: Select -> Auto Checkout Credit?
        // Let's just select for now to avoid accidental sales.
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
                    <ProductSearch onProductSelect={addToCart} orgId={user?.email || ''} />
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
                        <div className="flex gap-2">
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
                            {selectedCustomer && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
                                    title="Receive Payment"
                                >
                                    <Wallet className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        {selectedCustomer && (
                            <div className="mt-2 text-sm">
                                <span className="text-neutral-500">Balance: </span>
                                <span className={`font-semibold ${selectedCustomer.totalCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    ₹{selectedCustomer.totalCredit?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                        )}
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
                            disabled={cart.length === 0 || isProcessing}
                            className="bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
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

            {/* Customer Selection Modal */}
            {showCustomerModal && (
                <CustomerSelectionModal
                    customers={customers}
                    onSelect={handleCustomerSelect}
                    onClose={() => setShowCustomerModal(false)}
                    orgId={user?.email || ''}
                />
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedCustomer && (
                <PaymentModal
                    customer={selectedCustomer}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        refreshCustomers();
                        // alert("Payment recorded successfully!"); // Optional feedback
                    }}
                />
            )}

            {/* Hidden Receipt for Printing - ReceiptTemplate handles its own display logic */}
            <div>
                {lastSale && (
                    <ReceiptTemplate
                        sale={lastSale}
                        orgName={orgName || 'My Shop'}
                        gstNumber={gstNumber}
                        customerBalance={
                            // If we have a selected customer, calculate their NEW balance.
                            // The 'selectedCustomer' state might not be updated yet if we didn't refetch.
                            // But for the receipt, we can estimate:
                            // If credit sale: Old Balance + Grand Total
                            // If cash sale: Old Balance (unchanged)
                            // Wait, recordSale updates the DB.
                            // Ideally we should pass the balance from the response or calculate it.
                            // Let's use the selectedCustomer.totalCredit + (credit sale ? amount : 0)
                            selectedCustomer ? (
                                (selectedCustomer.totalCredit || 0) + (lastSale.paymentMode === 'credit' ? lastSale.grandTotal : 0)
                            ) : undefined
                        }
                    />
                )}
            </div>
        </div>
    );
}
