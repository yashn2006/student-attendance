import React from 'react';
import { HistoryFilter } from '../types';

interface HistoryFilterTabsProps {
  activeTab: HistoryFilter;
  onSelectTab: (tab: HistoryFilter) => void;
}

export const HistoryFilterTabs: React.FC<HistoryFilterTabsProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs: HistoryFilter[] = ['Today', 'This Week', 'This Month', 'All Time'];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSelectTab(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
              isActive
                ? 'bg-[#12A176] text-white border-[#12A176] shadow-xs'
                : 'bg-white text-[#14201B] border-[#DCEAE3] hover:bg-[#F8FDFB]'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
};
