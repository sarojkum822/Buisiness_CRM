'use client';

import React from 'react';
import { Product } from '@/types';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';

interface ProductsTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onAdjustStock: (product: Product) => void;
    onDelete: (product: Product) => void;
}

export function ProductsTable({ products, onEdit, onAdjustStock, onDelete }: ProductsTableProps) {
    const getStockStatus = (product: Product) => {
        if (product.currentStock === 0) {
            return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
        }
        if (product.currentStock <= product.lowStockThreshold) {
            return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
        }
        return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    };

    if (products.length === 0) {
        return (
            <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
                <div className="mb-2 text-4xl">📦</div>
                <h3 className="mb-1 text-lg font-semibold text-neutral-900">No products yet</h3>
                <p className="text-sm text-neutral-600">
                    Get started by adding your first product to the inventory.
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
                {products.map((product) => {
                    const status = getStockStatus(product);
                    return (
                        <TableRow key={product.id}>
                            <TableCell>
                                <div className="font-medium text-neutral-900">{product.name}</div>
                            </TableCell>
                            <TableCell>
                                <span className="font-mono text-xs text-neutral-600">{product.sku}</span>
                            </TableCell>
                            <TableCell>
                                <span className="text-neutral-600">{product.category}</span>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="font-medium">{product.currentStock}</span>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="font-medium">₹{product.sellingPrice.toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${status.color}`}>
                                    {status.label}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onEdit(product)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => onAdjustStock(product)}
                                    >
                                        Adjust Stock
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                                onDelete(product);
                                            }
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
