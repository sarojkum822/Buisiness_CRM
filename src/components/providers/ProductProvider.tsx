'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Product } from '@/types';

interface ProductContextType {
    products: Product[];
    loading: boolean;
    refreshProducts: () => void;
}

const ProductContext = createContext<ProductContextType>({
    products: [],
    loading: true,
    refreshProducts: () => { },
});

export const useProducts = () => useContext(ProductContext);

export function ProductProvider({ children }: { children: React.ReactNode }) {
    const { orgId } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) {
            setProducts([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const productsRef = collection(db, 'products');
        // Order by name for consistent display
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
        }, (error) => {
            console.error("ProductProvider Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orgId]);

    const refreshProducts = () => {
        // Real-time listener handles updates automatically, 
        // but we expose this if manual re-trigger is ever needed (rare with onSnapshot)
    };

    return (
        <ProductContext.Provider value={{ products, loading, refreshProducts }}>
            {children}
        </ProductContext.Provider>
    );
}
