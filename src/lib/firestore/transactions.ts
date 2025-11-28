import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CustomerTransaction } from '@/types';

const transactionsCollection = collection(db, 'customer_transactions');

// Add a new transaction
export async function addTransaction(
    orgId: string,
    customerId: string,
    type: 'SALE' | 'PAYMENT' | 'OPENING_BALANCE',
    amount: number,
    balanceAfter: number,
    description: string,
    referenceId?: string
): Promise<string> {
    const newTransaction = {
        orgId,
        customerId,
        type,
        amount,
        balanceAfter,
        description,
        referenceId: referenceId || null,
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(transactionsCollection, newTransaction);
    return docRef.id;
}

// Get transactions for a customer
export async function getCustomerTransactions(customerId: string): Promise<CustomerTransaction[]> {
    const q = query(
        transactionsCollection,
        where('customerId', '==', customerId),
        orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    })) as unknown as CustomerTransaction[];
}
