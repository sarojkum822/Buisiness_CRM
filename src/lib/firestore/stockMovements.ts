import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StockMovement } from '@/types';

/**
 * Create a stock movement record
 */
export async function createStockMovement(
    orgId: string,
    movementData: Omit<StockMovement, 'id'>
): Promise<string> {
    const movementsRef = collection(db, 'stockMovements');

    const docRef = await addDoc(movementsRef, {
        ...movementData,
        orgId,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
}

/**
 * Get stock movements for an organization, optionally filtered by product
 */
export async function getStockMovements(
    orgId: string,
    productId?: string
): Promise<StockMovement[]> {
    const movementsRef = collection(db, 'stockMovements');

    let q = query(movementsRef, where('orgId', '==', orgId), orderBy('createdAt', 'desc'));

    if (productId) {
        q = query(movementsRef, where('orgId', '==', orgId), where('productId', '==', productId), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as StockMovement[];
}
