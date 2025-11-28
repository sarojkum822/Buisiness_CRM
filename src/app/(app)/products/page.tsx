'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product } from '@/types';
import { createProduct, updateProduct, deleteProduct, adjustStock } from '@/lib/firestore/products';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProductForm } from '@/components/products/ProductForm';
import { StockAdjustmentForm } from '@/components/products/StockAdjustmentForm';
import { ProductsTable } from '@/components/products/ProductsTable';
import RapidStockIn from '@/components/stock/RapidStockIn';

const CATEGORIES = ['All', 'Electronics', 'Groceries', 'Clothing', 'Hardware', 'Other'];

export default function ProductsPage() {
    const { orgId } = useAuth();
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [initialBarcode, setInitialBarcode] = useState<string>('');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showRapidStockIn, setShowRapidStockIn] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Real-time products listener
    useEffect(() => {
        if (!orgId) return;

        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('orgId', '==', orgId), orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as Product[];

            setProducts(productsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    // Check for barcode URL parameter and auto-open add modal
    useEffect(() => {
        const barcodeParam = searchParams.get('barcode');
        if (barcodeParam) {
            setInitialBarcode(barcodeParam);
            setShowAddModal(true);
            // Clear the param so it doesn't reopen on refresh
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('barcode');
            window.history.replaceState(null, '', `?${newParams.toString()}`);
        }
    }, [searchParams]);

    // Filter products based on search and category
    useEffect(() => {
        let filtered = products;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (p) =>
                    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category filter
        if (categoryFilter !== 'All') {
            filtered = filtered.filter((p) => p.category === categoryFilter);
        }

        setFilteredProducts(filtered);
    }, [products, searchTerm, categoryFilter]);

    const handleProductSave = async (data: any, mode: 'create' | 'update', productId?: string) => {
        if (!orgId) return;

        if (mode === 'create') {
            await createProduct(orgId, data);
            setShowAddModal(false);
            setInitialBarcode('');
        } else if (mode === 'update' && productId) {
            await updateProduct(orgId, productId, data);
            setShowEditModal(false);
            setSelectedProduct(null);
        }
    };

    const handleAdjustStock = async (adjustmentData: any) => {
        if (!orgId || !selectedProduct) return;
        await adjustStock(orgId, selectedProduct.id!, adjustmentData);
        setShowStockModal(false);
        setSelectedProduct(null);
    };

    const handleDeleteProduct = async (product: Product) => {
        if (!orgId || !product.id) return;
        await deleteProduct(orgId, product.id);
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-6">
                <div className="text-center">
                    <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
                    <p className="text-sm text-neutral-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Products</h1>
                <p className="mt-2 text-neutral-600">
                    Manage your inventory and stock levels.
                </p>
            </div>

            {/* Filters and Actions */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-4">
                    <div className="flex-1 sm:max-w-xs">
                        <Input
                            placeholder="Search by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-40">
                        <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setShowRapidStockIn(true)}>
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Rapid Stock-In
                    </Button>
                    <Button onClick={() => setShowAddModal(true)}>
                        + Add Product
                    </Button>
                </div>
            </div>

            {/* Products Table */}
            <ProductsTable
                products={filteredProducts}
                onEdit={(product) => {
                    setSelectedProduct(product);
                    setShowEditModal(true);
                }}
                onAdjustStock={(product) => {
                    setSelectedProduct(product);
                    setShowStockModal(true);
                }}
                onDelete={handleDeleteProduct}
            />

            {/* Add Product Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setInitialBarcode('');
                }}
                title="Add New Product"
                size="xl"
            >
                <ProductForm
                    initialBarcode={initialBarcode}
                    onSave={handleProductSave}
                    onCancel={() => {
                        setShowAddModal(false);
                        setInitialBarcode('');
                    }}
                />
            </Modal>

            {/* Edit Product Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                }}
                title="Edit Product"
                size="xl"
            >
                {selectedProduct && (
                    <ProductForm
                        product={selectedProduct}
                        onSave={handleProductSave}
                        onCancel={() => {
                            setShowEditModal(false);
                            setSelectedProduct(null);
                        }}
                    />
                )}
            </Modal>

            {/* Adjust Stock Modal */}
            <Modal
                isOpen={showStockModal}
                onClose={() => {
                    setShowStockModal(false);
                    setSelectedProduct(null);
                }}
                title="Adjust Stock"
            >
                {selectedProduct && (
                    <StockAdjustmentForm
                        productName={selectedProduct.name}
                        currentStock={selectedProduct.currentStock}
                        onSubmit={handleAdjustStock}
                        onCancel={() => {
                            setShowStockModal(false);
                            setSelectedProduct(null);
                        }}
                    />
                )}
            </Modal>

            {/* Rapid Stock-In Modal */}
            {showRapidStockIn && orgId && (
                <RapidStockIn
                    orgId={orgId}
                    onClose={() => setShowRapidStockIn(false)}
                    onSuccess={() => {
                        // Products will auto-refresh via real-time listener
                        setShowRapidStockIn(false);
                    }}
                />
            )}
        </div>
    );
}
