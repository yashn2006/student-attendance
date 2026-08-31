import React, { useState, useMemo } from 'react';
import { HistoryFilter, CanteenTransaction } from './types';
import { HistoryFilterTabs } from './components/HistoryFilterTabs';
import { TransactionRow } from './components/TransactionRow';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

interface OrderHistoryProps {
  transactions: CanteenTransaction[];
  onBackToHome?: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  transactions,
  onBackToHome
}) => {
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('This Month');

  // Filter logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 3600 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return transactions.filter((t) => {
      const tTime = new Date(t.createdAt).getTime();
      if (activeFilter === 'Today') {
        return tTime >= todayStart || t.dateGroup === 'Today';
      }
      if (activeFilter === 'This Week') {
        return tTime >= weekStart || t.dateGroup === 'Today' || t.dateGroup === 'Yesterday';
      }
      if (activeFilter === 'This Month') {
        return tTime >= monthStart || t.dateGroup === 'Today' || t.dateGroup === 'Yesterday' || t.dateGroup.includes('Aug');
      }
      return true; // 'All Time'
    });
  }, [transactions, activeFilter]);

  // Calculate total spent in selected filter
  const totalSpentInFilter = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  // Group transactions by dateGroup
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: CanteenTransaction[] } = {};
    filteredTransactions.forEach((t) => {
      const groupKey = t.dateGroup || 'Recent';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 text-[#14201B]">
      {/* Header with back option if requested */}
      <div className="flex items-center justify-between">
        <div>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#12A176] hover:text-[#0E8360] mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Canteen Credits
            </button>
          )}
          <h3 className="text-xl font-bold text-[#14201B]">Order History</h3>
          <p className="text-xs text-[#5C6B63] font-medium">
            Complete statement of meal allowance deductions & refill credits
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <HistoryFilterTabs activeTab={activeFilter} onSelectTab={setActiveFilter} />

      {/* Summary line */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#5C6B63] px-1">
        <span>
          <strong className="text-[#14201B] font-bold">₹{totalSpentInFilter}</strong> spent {activeFilter.toLowerCase()}
        </span>
        <span>{filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grouped Transaction List */}
      <div className="space-y-4">
        {Object.keys(groupedTransactions).length > 0 ? (
          (Object.entries(groupedTransactions) as [string, CanteenTransaction[]][]).map(([dateLabel, groupItems]) => (
            <div key={dateLabel} className="bg-white rounded-2xl border border-[#DCEAE3] shadow-xs overflow-hidden">
              <div className="bg-[#F8FDFB] px-4 py-2 border-b border-[#DCEAE3] text-xs font-bold text-[#5C6B63] uppercase tracking-wider">
                {dateLabel}
              </div>
              <div>
                {groupItems.map((txn, idx) => (
                  <TransactionRow
                    key={txn.id}
                    transaction={txn}
                    showDivider={idx < groupItems.length - 1}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-[#DCEAE3] p-12 text-center text-[#5C6B63] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E5F5EE] border border-[#DCEAE3] text-[#12A176] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 text-[#12A176]" />
            </div>
            <h4 className="font-bold text-sm text-[#14201B]">No orders yet in this period</h4>
            <p className="text-xs max-w-xs mx-auto text-[#5C6B63]">
              No canteen allowance deductions found for {activeFilter.toLowerCase()}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
