import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    limit,
    serverTimestamp,
    runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import { createStockMovement } from './stockMovements';

/**
 * Get all products for an organization
 */
export async function getProducts(orgId: string): Promise<Product[]> {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('orgId', '==', orgId), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Product[];
}

/**
 * Get a single product by ID
 */
export async function getProduct(orgId: string, productId: string): Promise<Product | null> {
    const productRef = doc(db, 'products', productId);
    const snapshot = await getDoc(productRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate() || new Date(),
        updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
    } as Product;
}

/**
 * Find a product by barcode
 */
/**
 * Find a product by barcode
 */
export async function findProductByBarcode(orgId: string, barcode: string): Promise<Product | null> {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('orgId', '==', orgId), where('barcode', '==', barcode), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as Product;
}

/**
 * Search products by name (partial match)
 */
export async function searchProductsByName(orgId: string, nameQuery: string): Promise<Product[]> {
    if (!nameQuery || nameQuery.length < 2) return [];

    const productsRef = collection(db, 'products');
    // Firestore prefix search
    const q = query(
        productsRef,
        where('orgId', '==', orgId),
        where('name', '>=', nameQuery),
        where('name', '<=', nameQuery + '\uf8ff'),
        limit(10)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Product[];
}

/**
 * Create a new product
 */
export async function createProduct(
    orgId: string,
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchasedQty' | 'totalSoldQty' | 'totalRevenue' | 'totalCost'>
): Promise<string> {
    const productsRef = collection(db, 'products');

    const newProduct = {
        ...productData,
        orgId,
        totalPurchasedQty: productData.currentStock,
        totalSoldQty: 0,
        totalRevenue: 0,
        totalCost: productData.currentStock * productData.costPrice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(productsRef, newProduct);

    // Create initial stock movement if there's initial stock
    if (productData.currentStock > 0) {
        await createStockMovement(orgId, {
            productId: docRef.id,
            productName: productData.name,
            type: 'IN',
            quantity: productData.currentStock,
            unitCost: productData.costPrice,
            reason: 'Initial stock',
            createdAt: new Date(),
        });
    }

    return docRef.id;
}

/**
 * Update an existing product
 */
export async function updateProduct(
    orgId: string,
    productId: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
    const productRef = doc(db, 'products', productId);

    await updateDoc(productRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete a product
 */
export async function deleteProduct(orgId: string, productId: string): Promise<void> {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
}

/**
 * Adjust stock for a product
 */
export async function adjustStock(
    orgId: string,
    productId: string,
    adjustment: {
        type: 'IN' | 'OUT' | 'ADJUSTMENT';
        quantity: number;
        unitCost: number;
        reason: string;
    }
): Promise<void> {
    const productRef = doc(db, 'products', productId);

    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
            throw new Error('Product not found');
        }

        const product = productDoc.data() as Product;
        let newStock = product.currentStock;
        let newTotalPurchased = product.totalPurchasedQty;
        let newTotalCost = product.totalCost;

        // Calculate new stock based on adjustment type
        if (adjustment.type === 'IN') {
            newStock += adjustment.quantity;
            newTotalPurchased += adjustment.quantity;
            newTotalCost += adjustment.quantity * adjustment.unitCost;
        } else if (adjustment.type === 'OUT') {
            newStock -= adjustment.quantity;
            if (newStock < 0) {
                throw new Error('Insufficient stock');
            }
        } else if (adjustment.type === 'ADJUSTMENT') {
            // For adjustments, set to exact quantity
            newStock = adjustment.quantity;
        }

        // Update product
        transaction.update(productRef, {
            currentStock: newStock,
            totalPurchasedQty: newTotalPurchased,
            totalCost: newTotalCost,
            updatedAt: serverTimestamp(),
        });

        // Create stock movement record
        const movementRef = doc(collection(db, 'stockMovements'));
        transaction.set(movementRef, {
            orgId,
            productId,
            productName: product.name,
            type: adjustment.type,
            quantity: adjustment.quantity,
            unitCost: adjustment.unitCost,
            reason: adjustment.reason,
            createdAt: serverTimestamp(),
        });
    });
}
