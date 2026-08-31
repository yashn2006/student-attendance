import { CanteenAccount, CanteenTransaction } from './types';

const INITIAL_ACCOUNT: CanteenAccount = {
  teacherId: 'T-1029',
  teacherName: 'Prof. Aanushiya Sitaraman',
  monthlyAllowance: 500,
  currentBalance: 440,
  lastRefillAt: '2026-08-01'
};

const INITIAL_TRANSACTIONS: CanteenTransaction[] = [
  {
    id: 'txn_101',
    teacherId: 'T-1029',
    amount: -30,
    note: 'Cold Coffee',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    formattedDate: 'Today, 10:45 AM',
    dateGroup: 'Today',
    balanceAfter: 440,
    referenceNo: 'TXN-849204'
  },
  {
    id: 'txn_102',
    teacherId: 'T-1029',
    amount: -30,
    note: 'Veg Sandwich',
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    formattedDate: 'Yesterday, 4:15 PM',
    dateGroup: 'Yesterday',
    balanceAfter: 470,
    referenceNo: 'TXN-849203'
  },
  {
    id: 'txn_103',
    teacherId: 'T-1029',
    amount: 500,
    note: 'Monthly Allowance Credit',
    createdAt: '2026-08-01T09:00:00.000Z',
    formattedDate: 'Aug 1, 9:00 AM',
    dateGroup: 'Aug 1',
    balanceAfter: 500,
    referenceNo: 'TXN-849202'
  },
  {
    id: 'txn_104',
    teacherId: 'T-1029',
    amount: -60,
    note: 'South Indian Thali',
    createdAt: '2026-07-30T13:20:00.000Z',
    formattedDate: 'Jul 30, 1:20 PM',
    dateGroup: 'Jul 30',
    balanceAfter: 0,
    referenceNo: 'TXN-849201'
  }
];

const CANTEEN_STORAGE_KEY = 'campus_os_canteen_data';

export interface CanteenStorageState {
  account: CanteenAccount;
  transactions: CanteenTransaction[];
}

export function getCanteenData(): CanteenStorageState {
  try {
    const stored = localStorage.getItem(CANTEEN_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to read canteen storage:', err);
  }
  return {
    account: INITIAL_ACCOUNT,
    transactions: INITIAL_TRANSACTIONS
  };
}

export function saveCanteenData(data: CanteenStorageState): void {
  try {
    localStorage.setItem(CANTEEN_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save canteen storage:', err);
  }
}
