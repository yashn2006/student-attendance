import React from 'react';
import { CanteenTransaction } from '../types';
import { Coffee, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionRowProps {
  transaction: CanteenTransaction;
  showDivider?: boolean;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  showDivider = true
}) => {
  const isSpend = transaction.amount < 0;

  return (
    <div
      className={`flex items-center justify-between py-3 px-3 sm:px-4 hover:bg-[#F8FDFB] transition-colors rounded-xl ${
        showDivider ? 'border-b border-[#DCEAE3]' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isSpend
              ? 'bg-[#DB5B4E]/10 border-[#DB5B4E]/30 text-[#DB5B4E]'
              : 'bg-[#E5F5EE] border-[#DCEAE3] text-[#12A176]'
          }`}
        >
          {isSpend ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownLeft className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="font-bold text-xs text-[#14201B] truncate">
              {transaction.note || 'Canteen Order'}
            </h5>
            <span className="text-[10px] font-mono text-[#5C6B63] bg-[#E5F5EE] px-1.5 py-0.2 rounded border border-[#DCEAE3] shrink-0 hidden sm:inline-block">
              {transaction.referenceNo}
            </span>
          </div>
          <p className="text-[11px] text-[#5C6B63] font-medium mt-0.5">
            {transaction.formattedDate}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span
          className={`font-bold text-sm block ${
            isSpend ? 'text-[#DB5B4E]' : 'text-[#12A176]'
          }`}
        >
          {isSpend ? `-₹${Math.abs(transaction.amount)}` : `+₹${transaction.amount}`}
        </span>
        <span className="text-[10px] text-[#5C6B63] block font-medium">
          Bal: ₹{transaction.balanceAfter}
        </span>
      </div>
    </div>
  );
};
