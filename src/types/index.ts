// Organization types
export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  gstNumber?: string;
  createdAt: Date;
}

export interface OrgUser {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
  isActive: boolean;
}

// Product types
export interface Product {
  id?: string;
  orgId: string;
  name: string;
  sku: string;
  barcode?: string; // Optional barcode for scanning
  category: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  totalSoldQty: number;
  totalPurchasedQty: number;
  totalRevenue: number;
  totalCost: number;
  lastSaleDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sale types
export interface SaleItem {
  productId: string;
  productName?: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  lineTotal: number;
  lineCostTotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  items: SaleItem[];
  subTotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  totalCost: number;
  totalPaid?: number; // Amount actually paid (0 for full credit)
  paymentMode: 'cash' | 'card' | 'upi' | 'credit' | 'other';
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  createdAt: Date;
}

// Stock Movement types
export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unitCost: number;
  reason: string;
  saleId?: string;
  createdAt: Date;
}

// Daily Stats types
export interface DailyStats {
  id: string;
  date: string; // yyyy-MM-dd format
  totalSalesAmount: number;
  totalCostAmount: number;
  totalProfit: number;
  totalBills: number;
  totalItemsSold: number;
  createdAt: Date;
}

export interface UserMapping {
  userId: string;
  orgId: string;
  email: string;
  displayName: string;
}

// Customer types
export interface Customer {
  id?: string;
  orgId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalCredit: number;
  totalVisits: number;
  totalSpent: number;
  lastVisit: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerTransaction {
  id: string;
  orgId: string;
  customerId: string;
  type: 'SALE' | 'PAYMENT' | 'OPENING_BALANCE';
  amount: number; // Positive for Debit (Sale), Negative for Credit (Payment)
  balanceAfter: number;
  description: string;
  referenceId?: string; // Sale ID or Payment ID
  date: Date;
}

// Supplier types
export interface Supplier {
  id?: string;
  orgId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
