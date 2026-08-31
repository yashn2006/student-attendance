import React from 'react';

interface AmountSelectorProps {
  selectedAmount: number;
  onSelectAmount: (amount: number) => void;
  customAmount: string;
  onCustomAmountChange: (value: string) => void;
}

export const AmountSelector: React.FC<AmountSelectorProps> = ({
  selectedAmount,
  onSelectAmount,
  customAmount,
  onCustomAmountChange
}) => {
  const PRESET_AMOUNTS = [10, 20, 50, 100];

  const handlePillClick = (amt: number) => {
    onSelectAmount(amt);
    onCustomAmountChange('');
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onCustomAmountChange(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onSelectAmount(parsed);
    } else {
      onSelectAmount(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Running Total Visual Display */}
      <div className="bg-[#F8FDFB] border border-[#DCEAE3] rounded-2xl p-4 text-center">
        <span className="text-xs font-semibold text-[#5C6B63] block uppercase tracking-wider">
          Total Deduction Amount
        </span>
        <div className="text-3xl md:text-4xl font-bold text-[#14201B] mt-1">
          ₹{selectedAmount || 0}
        </div>
      </div>

      {/* Quick Select Preset Pills */}
      <div>
        <label className="block text-xs font-bold text-[#14201B] mb-2">
          Select Quick Preset
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((amt) => {
            const isSelected = selectedAmount === amt && !customAmount;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => handlePillClick(amt)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#12A176] text-white border-[#12A176] shadow-xs'
                    : 'bg-white text-[#14201B] border-[#DCEAE3] hover:bg-[#F8FDFB]'
                }`}
              >
                ₹{amt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Amount Input */}
      <div>
        <label className="block text-xs font-bold text-[#14201B] mb-1">
          Or enter custom amount
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#5C6B63]">
            ₹
          </span>
          <input
            type="number"
            min="1"
            max="1000"
            placeholder="e.g. 35"
            value={customAmount}
            onChange={handleCustomInputChange}
            className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-[#DCEAE3] rounded-xl text-xs font-bold text-[#14201B] focus:outline-none focus:border-[#12A176] transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
