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
import { SmartProductScanner } from '@/components/products/SmartProductScanner';
import { EnhancedProductForm } from '@/components/products/EnhancedProductForm';



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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

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
        if (!orgId) {
            alert('Error: Organization ID not found');
            return;
        }

        try {
            if (mode === 'create') {
                console.log('Creating product:', data);
                const newProductId = await createProduct(orgId, data);
                console.log('Product created successfully:', newProductId);
                alert(`Product "${data.name}" created successfully!`);
                setShowAddModal(false);
                setInitialBarcode('');
            } else if (mode === 'update' && productId) {
                console.log('Updating product:', productId, data);
                await updateProduct(orgId, productId, data);
                console.log('Product updated successfully');
                alert(`Product "${data.name}" updated successfully!`);
                setShowEditModal(false);
                setSelectedProduct(null);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert(`Failed to ${mode} product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleAdjustStock = async (adjustmentData: any) => {
        if (!orgId || !selectedProduct) {
            alert('Error: Missing organization ID or product');
            return;
        }

        try {
            console.log('Adjusting stock for:', selectedProduct.name, adjustmentData);
            await adjustStock(orgId, selectedProduct.id!, adjustmentData);
            console.log('Stock adjusted successfully');
            alert(`Stock adjusted successfully for "${selectedProduct.name}"!`);
            setShowStockModal(false);
            setSelectedProduct(null);
        } catch (error) {
            console.error('Error adjusting stock:', error);
            alert(`Failed to adjust stock: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDeleteProduct = async (product: Product) => {
        if (!orgId || !product.id) {
            alert('Error: Missing organization ID or product ID');
            return;
        }

        try {
            console.log('Deleting product:', product.name);
            await deleteProduct(orgId, product.id);
            console.log('Product deleted successfully');
            alert(`Product "${product.name}" deleted successfully!`);
            setShowDeleteModal(false);
            setProductToDelete(null);
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleBatchSave = async (items: any[]) => {
        if (!orgId) {
            alert('Error: Organization ID not found');
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        try {
            for (const item of items) {
                try {
                    if (item.type === 'new') {
                        console.log('Creating product:', item.data.name);
                        await createProduct(orgId, item.data);
                        successCount++;
                    } else if (item.type === 'update' && item.productId) {
                        console.log('Updating product:', item.data.name);
                        await updateProduct(orgId, item.productId, item.data);
                        successCount++;
                    }
                } catch (error) {
                    console.error('Error saving item:', item.data.name, error);
                    errorCount++;
                    errors.push(item.data.name);
                }
            }

            // Show results
            if (errorCount === 0) {
                alert(`✅ Successfully saved all ${successCount} products!`);
                setShowAddModal(false);
            } else {
                alert(`⚠️ Saved ${successCount} products.\nFailed to save ${errorCount} products:\n${errors.join(', ')}`);
            }
        } catch (error) {
            console.error('Batch save error:', error);
            alert('Failed to save products');
        }
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
                onDelete={(product) => {
                    setProductToDelete(product);
                    setShowDeleteModal(true);
                }}
            />

            {/* Add Product Modal - Smart Scanner */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setInitialBarcode('');
                }}
                title="Smart Product Scanner"
                size="xl"
            >
                <SmartProductScanner
                    onSaveAll={handleBatchSave}
                    onClose={() => {
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
                    <EnhancedProductForm
                        product={selectedProduct}
                        onSave={handleProductSave}
                        onCancel={() => {
                            setShowEditModal(false);
                            setSelectedProduct(null);
                        }}
                        onAdjustStock={() => {
                            setShowEditModal(false);
                            setShowStockModal(true);
                        }}
                        onViewHistory={() => {
                            // TODO: Implement history view
                            alert('History feature coming soon!');
                        }}
                        onDuplicate={() => {
                            // TODO: Implement duplicate
                            alert('Duplicate feature coming soon!');
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                }}
                title="Confirm Delete"
            >
                {productToDelete && (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-900">
                                        Delete Product
                                    </h3>
                                    <p className="mt-1 text-sm text-red-700">
                                        Are you sure you want to delete <strong>"{productToDelete.name}"</strong>?
                                    </p>
                                    <p className="mt-2 text-sm text-red-600">
                                        This action cannot be undone. All product data and history will be permanently removed.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setProductToDelete(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDeleteProduct(productToDelete)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete Product
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>


        </div>
    );
}
