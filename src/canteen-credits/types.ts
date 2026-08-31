export interface CanteenAccount {
  teacherId: string;
  teacherName: string;
  monthlyAllowance: number;
  currentBalance: number;
  lastRefillAt: string;
}

export interface CanteenTransaction {
  id: string;
  teacherId: string;
  amount: number; // negative for spend (e.g. -50), positive for refill (e.g. +500)
  note: string;
  createdAt: string; // ISO timestamp
  formattedDate: string; // e.g., "Today, 1:15 PM"
  dateGroup: 'Today' | 'Yesterday' | string;
  balanceAfter: number;
  referenceNo: string;
}

export type HistoryFilter = 'Today' | 'This Week' | 'This Month' | 'All Time';
