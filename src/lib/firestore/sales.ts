import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sale, Product } from '@/types';

/**
 * Generate invoice number for a sale
 * Format: INV-YYYYMMDD-XXXX
 */
async function generateInvoiceNumber(orgId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    // Get today's sales to find the next number
    const salesRef = collection(db, 'sales');
    const todayStart = new Date(today.setHours(0, 0, 0, 0));

    const q = query(
        salesRef,
        where('orgId', '==', orgId),
        where('createdAt', '>=', todayStart),
        orderBy('createdAt', 'desc'),
        limit(1)
    );

    const snapshot = await getDocs(q);

    let nextNum = 1;
    if (!snapshot.empty) {
        const lastInvoice = snapshot.docs[0].data().invoiceNumber;
        const lastNum = parseInt(lastInvoice.split('-')[2]);
        nextNum = lastNum + 1;
    }

    return `INV - ${dateStr} -${nextNum.toString().padStart(4, '0')} `;
}

/**
 * Get all sales for an organization
 */
export async function getSales(
    orgId: string,
    options?: { startDate?: Date; endDate?: Date }
): Promise<Sale[]> {
    const salesRef = collection(db, 'sales');
    let q = query(salesRef, where('orgId', '==', orgId), orderBy('createdAt', 'desc'));

    if (options?.startDate) {
        q = query(q, where('createdAt', '>=', options.startDate));
    }
    if (options?.endDate) {
        q = query(q, where('createdAt', '<=', options.endDate));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Sale[];
}

/**
 * Get a single sale by ID
 */
export async function getSale(orgId: string, saleId: string): Promise<Sale | null> {
    const saleRef = doc(db, 'sales', saleId);
    const snapshot = await getDoc(saleRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate() || new Date(),
    } as Sale;
}

/**
 * Record a sale with automatic stock updates and stats tracking
 */
export async function recordSale(
    orgId: string,
    saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt'>
): Promise<string> {
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(orgId);

    // Execute transaction
    const saleId = await runTransaction(db, async (transaction) => {
        // ==========================================
        // PHASE 1: ALL READS MUST HAPPEN HERE FIRST
        // ==========================================

        // 1. Read all products
        const productReads = await Promise.all(
            saleData.items.map(item => {
                const productRef = doc(db, 'products', item.productId);
                return transaction.get(productRef);
            })
        );

        // 2. Read daily stats
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const statsRef = doc(db, 'dailyStats', `${orgId}_${dateStr}`);
        const statsDoc = await transaction.get(statsRef);

        // 3. Read monthly stats (Moved up to fix "Read after Write" error)
        const monthStr = dateStr.substring(0, 7); // YYYY-MM
        const monthlyStatsRef = doc(db, 'monthlyStats', `${orgId}_${monthStr}`);
        const monthlyStatsDoc = await transaction.get(monthlyStatsRef);

        // 4. Read customer if provided
        let customerDoc: any = null;
        let customerRef: any = null;
        if (saleData.customerId) {
            customerRef = doc(db, 'customers', saleData.customerId);
            customerDoc = await transaction.get(customerRef);
        }

        // ==========================================
        // VALIDATION LOGIC (No Reads/Writes here)
        // ==========================================
        const products: Product[] = [];
        for (let i = 0; i < productReads.length; i++) {
            const productDoc = productReads[i];
            const item = saleData.items[i];

            if (!productDoc.exists()) {
                throw new Error(`Product ${item.productId} not found`);
            }

            const product = productDoc.data() as Product;

            // Check stock availability
            if (product.currentStock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }

            products.push(product);
        }

        if (saleData.customerId && (!customerDoc || !customerDoc.exists())) {
            throw new Error(`Customer ${saleData.customerId} not found`);
        }

        // ==========================================
        // PHASE 2: ALL WRITES HAPPEN HERE LAST
        // ==========================================

        // 1. Create sale document
        const saleRef = doc(collection(db, 'sales'));
        const newSale = {
            ...saleData,
            customerId: saleData.customerId || null,
            customerName: saleData.customerName || null,
            customerPhone: saleData.customerPhone || null,
            orgId,
            invoiceNumber,
            createdAt: serverTimestamp(),
        };
        transaction.set(saleRef, newSale);

        // 2. Update products and create stock movements
        for (let i = 0; i < saleData.items.length; i++) {
            const item = saleData.items[i];
            const product = products[i];
            const productRef = doc(db, 'products', item.productId);

            // Update product stock and stats
            transaction.update(productRef, {
                currentStock: product.currentStock - item.quantity,
                totalSoldQty: (product.totalSoldQty || 0) + item.quantity,
                totalRevenue: (product.totalRevenue || 0) + item.lineTotal,
                lastSaleDate: new Date(),
                updatedAt: new Date(),
            });

            // Create stock movement
            const movementRef = doc(collection(db, 'stockMovements'));
            transaction.set(movementRef, {
                orgId,
                productId: item.productId,
                productName: item.productName,
                type: 'OUT',
                quantity: item.quantity,
                unitCost: item.costPrice,
                reason: `Sale ${invoiceNumber}`,
                saleId: saleRef.id,
                createdAt: serverTimestamp(),
            });
        }

        // 3. Update daily stats
        if (statsDoc.exists()) {
            const stats = statsDoc.data();
            transaction.update(statsRef, {
                totalSalesAmount: stats.totalSalesAmount + saleData.grandTotal,
                totalCostAmount: stats.totalCostAmount + saleData.totalCost,
                totalProfit: stats.totalProfit + (saleData.grandTotal - saleData.totalCost),
                totalBills: stats.totalBills + 1,
                totalItemsSold: stats.totalItemsSold + saleData.items.reduce((sum, item) => sum + item.quantity, 0),
            });
        } else {
            transaction.set(statsRef, {
                orgId,
                date: dateStr,
                totalSalesAmount: saleData.grandTotal,
                totalCostAmount: saleData.totalCost,
                totalProfit: saleData.grandTotal - saleData.totalCost,
                totalBills: 1,
                totalItemsSold: saleData.items.reduce((sum, item) => sum + item.quantity, 0),
                createdAt: serverTimestamp(),
            });
        }

        // 4. Update monthly stats
        if (monthlyStatsDoc.exists()) {
            const stats = monthlyStatsDoc.data();
            transaction.update(monthlyStatsRef, {
                totalSalesAmount: stats.totalSalesAmount + saleData.grandTotal,
                totalCostAmount: stats.totalCostAmount + saleData.totalCost,
                totalProfit: stats.totalProfit + (saleData.grandTotal - saleData.totalCost),
                totalBills: stats.totalBills + 1,
                totalItemsSold: stats.totalItemsSold + saleData.items.reduce((sum, item) => sum + item.quantity, 0),
            });
        } else {
            transaction.set(monthlyStatsRef, {
                orgId,
                month: monthStr,
                totalSalesAmount: saleData.grandTotal,
                totalCostAmount: saleData.totalCost,
                totalProfit: saleData.grandTotal - saleData.totalCost,
                totalBills: 1,
                totalItemsSold: saleData.items.reduce((sum, item) => sum + item.quantity, 0),
                createdAt: serverTimestamp(),
            });
        }

        // 5. Update customer stats
        if (customerRef && customerDoc && customerDoc.exists()) {
            const customer = customerDoc.data();
            const updates: any = {
                totalVisits: (customer.totalVisits || 0) + 1,
                totalSpent: (customer.totalSpent || 0) + saleData.grandTotal,
                lastVisit: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            if (saleData.paymentMode === 'credit') {
                updates.totalCredit = (customer.totalCredit || 0) + saleData.grandTotal;
            }

            transaction.update(customerRef, updates);

            // Log transaction
            const transactionRef = doc(collection(db, 'customer_transactions'));
            transaction.set(transactionRef, {
                orgId,
                customerId: saleData.customerId,
                type: 'SALE',
                amount: saleData.grandTotal, // Debit
                balanceAfter: (updates.totalCredit || 0),
                description: `Sale Invoice #${invoiceNumber}`,
                referenceId: saleRef.id,
                date: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        return saleRef.id;
    });

    return saleId;
}
