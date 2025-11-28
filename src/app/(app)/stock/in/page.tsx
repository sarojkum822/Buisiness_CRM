'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { findProductByBarcode } from '@/lib/firestore/products';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import BarcodeScanner from '@/components/stock/BarcodeScanner';
import QuickStockInModal from '@/components/stock/QuickStockInModal';
import { useRouter } from 'next/navigation';

export default function StockInPage() {
    const { orgId } = useAuth();
    const router = useRouter();
    const [barcodeInput, setBarcodeInput] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [showStockInModal, setShowStockInModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notFoundBarcode, setNotFoundBarcode] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input on mount and after operations
    useEffect(() => {
        inputRef.current?.focus();
    }, [showScanner, showStockInModal]);

    const handleBarcodeSearch = async (barcode: string) => {
        if (!barcode.trim() || !orgId) return;

        setLoading(true);
        setError('');
        setNotFoundBarcode('');

        try {
            const product = await findProductByBarcode(orgId, barcode.trim());

            if (product) {
                setFoundProduct(product);
                setShowStockInModal(true);
                setBarcodeInput('');
            } else {
                setNotFoundBarcode(barcode.trim());
                setError(`Product with barcode "${barcode.trim()}" not found`);
            }
        } catch (err: any) {
            console.error('Error searching barcode:', err);
            setError(err.message || 'Failed to search for product');
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleBarcodeSearch(barcodeInput);
    };

    const handleScanComplete = (barcode: string) => {
        setShowScanner(false);
        handleBarcodeSearch(barcode);
    };

    const handleStockInSuccess = () => {
        setFoundProduct(null);
        setShowStockInModal(false);
        setBarcodeInput('');
        inputRef.current?.focus();
    };

    const handleCreateProduct = () => {
        // Navigate to products page with barcode pre-filled
        router.push(`/products?barcode=${encodeURIComponent(notFoundBarcode)}`);
    };

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Stock-In Scanner</h1>
                <p className="mt-2 text-neutral-600">
                    Scan barcodes to quickly add stock to your inventory
                </p>
            </div>

            {/* Scanner Card */}
            <div className="mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-white p-6">
                <div className="mb-6">
                    <h2 className="mb-2 text-lg font-semibold text-neutral-900">Barcode Input</h2>
                    <p className="text-sm text-neutral-600">
                        Enter barcode manually, scan with camera, or use a physical scanner
                    </p>
                </div>

                {/* Manual Input Form */}
                <form onSubmit={handleManualSubmit} className="mb-6">
                    <div className="flex gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            placeholder="Type or scan barcode here..."
                            className="flex-1 rounded-lg border border-neutral-300 px-4 py-3 text-lg focus:border-neutral-900 focus:outline-none"
                            disabled={loading}
                        />
                        <Button type="submit" disabled={!barcodeInput.trim() || loading} isLoading={loading}>
                            Search
                        </Button>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                        💡 Physical scanners work automatically - just scan and press Enter
                    </p>
                </form>

                {/* Camera Scan Button */}
                <div className="mb-6">
                    <Button
                        onClick={() => setShowScanner(true)}
                        variant="secondary"
                        className="w-full"
                    >
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Scan with Camera
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="rounded-lg bg-red-50 p-4">
                        <div className="flex items-start">
                            <svg className="mr-3 h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-900">{error}</p>
                                {notFoundBarcode && (
                                    <div className="mt-3">
                                        <Button onClick={handleCreateProduct} variant="secondary" size="sm">
                                            Create New Product with this Barcode
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-6 rounded-lg bg-blue-50 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-blue-900">How to use:</h3>
                    <ul className="space-y-1 text-sm text-blue-700">
                        <li>• <strong>Manual Entry:</strong> Type the barcode and click Search</li>
                        <li>• <strong>Camera Scan:</strong> Click "Scan with Camera" to use your phone/webcam</li>
                        <li>• <strong>Physical Scanner:</strong> Just scan - it will auto-fill and submit</li>
                    </ul>
                </div>
            </div>

            {/* Barcode Scanner Modal */}
            {showScanner && (
                <BarcodeScanner
                    onScan={handleScanComplete}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Quick Stock-In Modal */}
            {showStockInModal && foundProduct && orgId && (
                <QuickStockInModal
                    product={foundProduct}
                    orgId={orgId}
                    onClose={() => {
                        setShowStockInModal(false);
                        setFoundProduct(null);
                    }}
                    onSuccess={handleStockInSuccess}
                />
            )}
        </div>
    );
}
