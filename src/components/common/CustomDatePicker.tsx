import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (dateStr: string) => void;
  label?: string;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse value or default to today
  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [currentViewDate, setCurrentViewDate] = useState<Date>(
    isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  );

  // Sync state if value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setCurrentViewDate(d);
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const viewYear = currentViewDate.getFullYear();
  const viewMonth = currentViewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

  // Shift Monday as first day (0 = Mon, 6 = Sun)
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleSelectDay = (dayNum: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const selectedIso = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(selectedIso);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    const todayIso = `${year}-${monthStr}-${dayStr}`;
    setCurrentViewDate(today);
    onChange(todayIso);
    setIsOpen(false);
  };

  const handleSelectQuick = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const year = target.getFullYear();
    const monthStr = String(target.getMonth() + 1).padStart(2, '0');
    const dayStr = String(target.getDate()).padStart(2, '0');
    const iso = `${year}-${monthStr}-${dayStr}`;
    setCurrentViewDate(target);
    onChange(iso);
    setIsOpen(false);
  };

  // Format button label text
  const formatDisplay = () => {
    if (!value) return 'Select Date';
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return value;
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();

    if (isToday) {
      return `Today, ${dayNum} ${monthName}`;
    }
    return `${dayName}, ${dayNum} ${monthName} ${d.getFullYear()}`;
  };

  // Helper to check if day is selected
  const isSelectedDay = (dayNum: number) => {
    if (!value) return false;
    const d = new Date(value + 'T00:00:00');
    return (
      d.getDate() === dayNum &&
      d.getMonth() === viewMonth &&
      d.getFullYear() === viewYear
    );
  };

  // Helper to check if day is today
  const isTodayDay = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {label && (
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#6B6478] mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#FBF9F4] hover:bg-[#E8E3D9]/40 border border-[#E8E3D9] text-[#1A1025] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer select-none"
      >
        <CalendarIcon className="w-4 h-4 text-[#8B5CF6]" />
        <span>{formatDisplay()}</span>
        <span className="text-[10px] text-[#8B5CF6] font-extrabold ml-1">▼</span>
      </button>

      {/* Interactive Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 z-50 bg-white border border-[#E8E3D9] rounded-3xl p-4 shadow-2xl w-[310px] text-[#1A1025] font-sans"
          >
            {/* Calendar Month & Year Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E3D9]">
              <div>
                <h4 className="font-black text-sm text-[#1A1025]">
                  {monthNames[viewMonth]} {viewYear}
                </h4>
                <p className="text-[10px] text-[#6B6478] font-medium">Pick session date</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-[#FBF9F4] text-[#1A1025] border border-[#E8E3D9] cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-[#FBF9F4] text-[#1A1025] border border-[#E8E3D9] cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center justify-between gap-1.5 mb-3">
              <button
                type="button"
                onClick={handleSelectToday}
                className="flex-1 py-1 rounded-lg bg-[#A3E635] text-[#1A1025] font-black text-[10px] hover:opacity-90 transition-all cursor-pointer text-center"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuick(1)}
                className="flex-1 py-1 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] font-bold text-[10px] hover:bg-[#8B5CF6]/25 transition-all cursor-pointer text-center"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuick(7)}
                className="flex-1 py-1 rounded-lg bg-[#FBF9F4] text-[#6B6478] border border-[#E8E3D9] font-bold text-[10px] hover:text-[#1A1025] transition-all cursor-pointer text-center"
              >
                +1 Week
              </button>
            </div>

            {/* Day of week headers */}
            <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase text-[#6B6478] mb-1">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Empty leading slots */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Day numbers */}
              {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = isSelectedDay(dayNum);
                const isToday = isTodayDay(dayNum);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-8 w-8 rounded-xl font-bold flex flex-col items-center justify-center relative mx-auto transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30 scale-105'
                        : isToday
                        ? 'bg-[#A3E635] text-[#1A1025] font-black'
                        : 'hover:bg-[#FBF9F4] text-[#1A1025]'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isToday && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[#1A1025] absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
