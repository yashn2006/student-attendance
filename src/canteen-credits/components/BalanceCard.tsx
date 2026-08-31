import React from 'react';
import { CanteenAccount } from '../types';

interface BalanceCardProps {
  account: CanteenAccount;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ account }) => {
  const usedAmount = Math.max(0, account.monthlyAllowance - account.currentBalance);
  const usedPercent = Math.min(
    100,
    Math.max(0, (usedAmount / account.monthlyAllowance) * 100)
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#DCEAE3] shadow-xs space-y-4 text-[#14201B]">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6B63]">
          AVAILABLE BALANCE
        </span>
        <span className="text-xs font-semibold text-[#12A176] bg-[#E5F5EE] px-2.5 py-0.5 rounded-full border border-[#DCEAE3]">
          Monthly Pass Active
        </span>
      </div>

      {/* Hero Balance Figure */}
      <div className="flex items-baseline gap-1">
        <span className="text-4xl md:text-5xl font-bold text-[#14201B] tracking-tight">
          ₹{account.currentBalance}
        </span>
      </div>

      {/* Progress Bar & Used Info */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-[#5C6B63] font-medium">
          <span>
            <strong className="text-[#14201B] font-bold">₹{usedAmount}</strong> used of ₹{account.monthlyAllowance} this month
          </span>
          <span>{Math.round(100 - usedPercent)}% remaining</span>
        </div>

        <div className="w-full h-2 bg-[#E5F5EE] rounded-full overflow-hidden border border-[#DCEAE3]/50">
          <div
            className="h-full bg-[#12A176] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${100 - usedPercent}%` }}
          />
        </div>
      </div>

      {/* Refresh Footer */}
      <div className="pt-2 border-t border-[#DCEAE3]/60 flex items-center justify-between text-[11px] text-[#5C6B63]">
        <span>Refreshes on 1st of every month</span>
        <span>Auto-credited by Campus Finance</span>
      </div>
    </div>
  );
};
