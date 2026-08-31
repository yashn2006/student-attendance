import React, { useState, useEffect } from 'react';
import { Plus, Coffee, ArrowRight, CheckCircle2 } from 'lucide-react';
import { BalanceCard } from './components/BalanceCard';
import { TransactionRow } from './components/TransactionRow';
import { UseCreditsModal } from './UseCreditsModal';
import { OrderHistory } from './OrderHistory';
import { getCanteenData, saveCanteenData } from './mockData';
import { CanteenAccount, CanteenTransaction } from './types';

export const CanteenCreditsHome: React.FC = () => {
  const [account, setAccount] = useState<CanteenAccount>(() => getCanteenData().account);
  const [transactions, setTransactions] = useState<CanteenTransaction[]>(() => getCanteenData().transactions);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'home' | 'history'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to localStorage whenever changed
  useEffect(() => {
    saveCanteenData({ account, transactions });
  }, [account, transactions]);

  // Handle deduction confirmation
  const handleConfirmDeduction = (amount: number, note: string): CanteenTransaction | null => {
    if (amount <= 0 || amount > account.currentBalance) return null;

    const newBalance = account.currentBalance - amount;
    const now = new Date();

    const newTxn: CanteenTransaction = {
      id: 'txn_' + Date.now(),
      teacherId: account.teacherId,
      amount: -amount,
      note: note || 'Canteen Order',
      createdAt: now.toISOString(),
      formattedDate: `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      dateGroup: 'Today',
      balanceAfter: newBalance,
      referenceNo: `TXN-${Math.floor(100000 + Math.random() * 900000)}`
    };

    setAccount((prev) => ({
      ...prev,
      currentBalance: newBalance
    }));

    setTransactions((prev) => [newTxn, ...prev]);

    setToastMessage(`₹${amount} successfully deducted for ${note}`);
    setTimeout(() => setToastMessage(null), 4000);

    return newTxn;
  };

  if (viewMode === 'history') {
    return (
      <div className="font-sans text-[#14201B]">
        <OrderHistory
          transactions={transactions}
          onBackToHome={() => setViewMode('home')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 font-sans text-[#14201B]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCEAE3] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl md:text-2xl font-bold text-[#14201B] tracking-tight">
              Canteen Credits
            </h2>
            <span className="text-xs font-bold bg-[#E5F5EE] text-[#12A176] px-3 py-1 rounded-full border border-[#DCEAE3]">
              Digital Allowance
            </span>
          </div>
          <p className="text-xs text-[#5C6B63] font-medium mt-0.5">
            Your monthly meal allowance, digitized
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-[#12A176] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Balance Card */}
      <BalanceCard account={account} />

      {/* Use Credits Button */}
      <button
        type="button"
        onClick={() => setIsUseModalOpen(true)}
        className="w-full py-3.5 bg-[#12A176] hover:bg-[#0E8360] text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#DCEAE3]"
      >
        <Plus className="w-5 h-5 text-white" />
        <span>Use Credits</span>
      </button>

      {/* Recent Orders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#14201B]">Recent Orders</h3>
          <button
            onClick={() => setViewMode('history')}
            className="text-xs font-bold text-[#12A176] hover:text-[#0E8360] flex items-center gap-1 cursor-pointer"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#DCEAE3] shadow-xs overflow-hidden">
          {transactions.slice(0, 4).map((txn, idx) => (
            <TransactionRow
              key={txn.id}
              transaction={txn}
              showDivider={idx < Math.min(transactions.length, 4) - 1}
            />
          ))}

          {transactions.length === 0 && (
            <div className="p-8 text-center text-xs text-[#5C6B63]">
              No canteen orders recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Use Credits Modal */}
      <UseCreditsModal
        isOpen={isUseModalOpen}
        onClose={() => setIsUseModalOpen(false)}
        account={account}
        onConfirmDeduction={handleConfirmDeduction}
      />
    </div>
  );
};
