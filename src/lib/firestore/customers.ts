import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer } from '@/types';
import { addTransaction } from './transactions';

// Collection reference
const customersCollection = collection(db, 'customers');

// Get all customers for an organization
export async function getCustomers(orgId: string): Promise<Customer[]> {
    const q = query(customersCollection, where('orgId', '==', orgId), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastVisit: doc.data().lastVisit?.toDate() || new Date(),
    })) as Customer[];
}

// Get a single customer
export async function getCustomer(customerId: string): Promise<Customer | null> {
    const docRef = doc(db, 'customers', customerId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return {
            id: snapshot.id,
            ...snapshot.data(),
            createdAt: snapshot.data().createdAt?.toDate() || new Date(),
            updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
            lastVisit: snapshot.data().lastVisit?.toDate() || new Date(),
        } as Customer;
    }
    return null;
}

// Create a new customer
export async function createCustomer(orgId: string, data: Partial<Customer>): Promise<string> {
    const newCustomer = {
        ...data,
        orgId,
        totalCredit: data.totalCredit || 0,
        totalVisits: 0,
        totalSpent: 0,
        lastVisit: new Date(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(customersCollection, newCustomer);

    // Log opening balance transaction if any
    if (newCustomer.totalCredit !== 0) {
        const { addTransaction } = await import('./transactions');
        await addTransaction(
            orgId,
            docRef.id,
            'OPENING_BALANCE',
            newCustomer.totalCredit,
            newCustomer.totalCredit,
            'Opening Balance'
        );
    }

    return docRef.id;
}

// Update a customer
export async function updateCustomer(customerId: string, data: Partial<Customer>): Promise<void> {
    const docRef = doc(db, 'customers', customerId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

// Delete a customer
export async function deleteCustomer(customerId: string): Promise<void> {
    const docRef = doc(db, 'customers', customerId);
    await deleteDoc(docRef);
}

// Record a payment towards credit
export async function recordCustomerPayment(customerId: string, amount: number): Promise<void> {
    const docRef = doc(db, 'customers', customerId);

    // Get current balance first to calculate new balance
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Customer not found');

    const currentCredit = docSnap.data().totalCredit || 0;
    const newCredit = currentCredit - amount;

    await updateDoc(docRef, {
        totalCredit: newCredit,
        updatedAt: serverTimestamp(),
    });

    // Log transaction
    // Log transaction
    await addTransaction(
        docSnap.data().orgId,
        customerId,
        'PAYMENT',
        amount, // Credit (negative impact on debt)
        newCredit,
        'Payment Received'
    );
}
