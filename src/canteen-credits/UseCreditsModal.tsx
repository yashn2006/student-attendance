import React, { useState } from 'react';
import { X, CheckCircle2, Coffee, Sparkles } from 'lucide-react';
import { AmountSelector } from './components/AmountSelector';
import { CanteenAccount, CanteenTransaction } from './types';
import { useAuth } from '../context/AuthContext';

interface UseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: CanteenAccount;
  onConfirmDeduction: (amount: number, note: string) => CanteenTransaction | null;
}

export const UseCreditsModal: React.FC<UseCreditsModalProps> = ({
  isOpen,
  onClose,
  account,
  onConfirmDeduction
}) => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [note, setNote] = useState<string>('Thali');
  const [step, setStep] = useState<'input' | 'receipt'>('input');
  const [receiptTxn, setReceiptTxn] = useState<CanteenTransaction | null>(null);

  if (!isOpen) return null;

  const isOverBalance = selectedAmount > account.currentBalance;
  const isButtonDisabled = selectedAmount <= 0 || isOverBalance;

  const handleConfirm = () => {
    if (isButtonDisabled) return;
    const txn = onConfirmDeduction(selectedAmount, note.trim() || 'Canteen Item');
    if (txn) {
      setReceiptTxn(txn);
      setStep('receipt');
    }
  };

  const handleDone = () => {
    // Reset modal state
    setStep('input');
    setReceiptTxn(null);
    setSelectedAmount(50);
    setCustomAmount('');
    setNote('Thali');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#14201B]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-xl border border-[#DCEAE3] animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {step === 'input' ? (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#DCEAE3] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#E5F5EE] text-[#12A176] flex items-center justify-center font-bold border border-[#DCEAE3]">
                  <Coffee className="w-5 h-5 text-[#12A176]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#14201B]">Use Credits</h3>
                  <p className="text-xs text-[#5C6B63] font-medium">Select or enter meal deduction amount</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#5C6B63] hover:text-[#14201B] hover:bg-[#F8FDFB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Selector */}
            <AmountSelector
              selectedAmount={selectedAmount}
              onSelectAmount={setSelectedAmount}
              customAmount={customAmount}
              onCustomAmountChange={setCustomAmount}
            />

            {/* Note Field */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-[#14201B] mb-1">
                What did you order?
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Thali, Tea, Samosa"
                className="w-full px-3.5 py-2.5 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-medium text-[#14201B] focus:outline-none focus:border-[#12A176] transition-colors"
              />
            </div>

            {/* Error Message if Over Balance */}
            {isOverBalance && (
              <p className="mt-3 text-xs font-bold text-[#DB5B4E] bg-[#DB5B4E]/10 p-2.5 rounded-xl border border-[#DB5B4E]/30 text-center">
                Insufficient balance (Current balance: ₹{account.currentBalance})
              </p>
            )}

            {/* Confirm Button */}
            <div className="mt-6 pt-4 border-t border-[#DCEAE3]">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isButtonDisabled}
                className="w-full py-3 bg-[#12A176] hover:bg-[#0E8360] disabled:bg-[#5C6B63]/30 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Deduct ₹{selectedAmount || 0}</span>
              </button>
            </div>
          </>
        ) : (
          /* SCREEN 2b — Order Confirmation / "Show to Counter" Receipt */
          <div className="text-center py-2 space-y-5">
            {/* Success Checkmark Circle */}
            <div className="w-16 h-16 rounded-full bg-[#E5F5EE] border border-[#DCEAE3] text-[#12A176] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9 text-[#12A176]" />
            </div>

            {/* Deduction Title & Amount */}
            <div>
              <span className="text-xs font-bold text-[#12A176] bg-[#E5F5EE] px-3 py-1 rounded-full uppercase tracking-wider border border-[#DCEAE3]">
                Transaction Approved
              </span>
              <h2 className="text-3xl font-bold text-[#14201B] mt-2">
                ₹{receiptTxn?.amount ? Math.abs(receiptTxn.amount) : selectedAmount} Deducted
              </h2>
              <p className="text-base font-semibold text-[#5C6B63] mt-1">
                "{receiptTxn?.note || note}"
              </p>
            </div>

            {/* Receipt Details Box */}
            <div className="bg-[#F8FDFB] border border-[#DCEAE3] p-4 rounded-2xl text-left space-y-2.5 text-xs text-[#5C6B63]">
              <div className="flex justify-between items-center pb-2 border-b border-[#DCEAE3]">
                <span>Timestamp:</span>
                <span className="font-bold text-[#14201B]">
                  {receiptTxn?.formattedDate || 'Today, Just Now'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#DCEAE3]">
                <span>Faculty Name:</span>
                <span className="font-bold text-[#14201B]">
                  {user.name || account.teacherName}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#DCEAE3]">
                <span>Ref Number:</span>
                <span className="font-mono font-bold text-[#12A176]">
                  {receiptTxn?.referenceNo || 'TXN-849205'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-medium text-[#14201B]">Updated Allowance:</span>
                <span className="text-sm font-bold text-[#12A176] bg-[#E5F5EE] px-2.5 py-0.5 rounded-lg border border-[#DCEAE3]">
                  New Balance: ₹{receiptTxn?.balanceAfter ?? account.currentBalance}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#5C6B63] font-medium italic">
              Please present this screen to the Canteen Reception as proof.
            </p>

            {/* Done Button */}
            <button
              type="button"
              onClick={handleDone}
              className="w-full py-3 bg-[#12A176] hover:bg-[#0E8360] text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
