import {
    collection,
    getDocs,
    query,
    where,
    limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';

/**
 * Search products by name (partial match)
 */
export async function searchProductsByName(orgId: string, nameQuery: string): Promise<Product[]> {
    if (!nameQuery || nameQuery.length < 2) return [];

    const productsRef = collection(db, 'products');

    // Helper to run query
    const runQuery = async (qStr: string) => {
        const q = query(
            productsRef,
            where('orgId', '==', orgId),
            where('name', '>=', qStr),
            where('name', '<=', qStr + '\uf8ff'),
            limit(10)
        );
        return await getDocs(q);
    };

    // Try exact match first (case-sensitive as typed)
    let snapshot = await runQuery(nameQuery);

    // If no results and query is lowercase, try capitalizing first letter (common case)
    if (snapshot.empty && /^[a-z]/.test(nameQuery)) {
        const capitalized = nameQuery.charAt(0).toUpperCase() + nameQuery.slice(1);
        snapshot = await runQuery(capitalized);
    }

    // If still no results, try fully uppercase (e.g. SKU/Code style names)
    if (snapshot.empty) {
        const upper = nameQuery.toUpperCase();
        if (upper !== nameQuery) {
            snapshot = await runQuery(upper);
        }
    }

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Product[];
}

/**
 * Search products by barcode (partial match)
 */
export async function searchProductsByBarcode(orgId: string, barcodeQuery: string): Promise<Product[]> {
    if (!barcodeQuery || barcodeQuery.length < 3) return [];

    const productsRef = collection(db, 'products');
    const q = query(
        productsRef,
        where('orgId', '==', orgId),
        where('barcode', '>=', barcodeQuery),
        where('barcode', '<=', barcodeQuery + '\uf8ff'),
        limit(5)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Product[];
}
