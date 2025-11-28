import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DailyStats } from '@/types';

/**
 * Get daily stats for a specific date
 */
export async function getDailyStats(orgId: string, date: string): Promise<DailyStats | null> {
    const statsRef = doc(db, 'dailyStats', `${orgId}_${date}`);
    const snapshot = await getDoc(statsRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate() || new Date(),
    } as DailyStats;
}

/**
 * Update or create daily stats
 * Note: This is typically handled by the recordSale transaction,
 * but can be used for manual adjustments if needed
 */
export async function updateDailyStats(
    orgId: string,
    date: string,
    updates: Partial<Omit<DailyStats, 'id' | 'date' | 'createdAt'>>
): Promise<void> {
    const statsRef = doc(db, 'dailyStats', `${orgId}_${date}`);
    const snapshot = await getDoc(statsRef);

    if (snapshot.exists()) {
        await setDoc(statsRef, {
            ...snapshot.data(),
            ...updates,
        }, { merge: true });
    } else {
        await setDoc(statsRef, {
            orgId,
            date,
            totalSalesAmount: 0,
            totalCostAmount: 0,
            totalProfit: 0,
            totalBills: 0,
            totalItemsSold: 0,
            ...updates,
            createdAt: serverTimestamp(),
        });
    }
}
