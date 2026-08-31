import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Download,
  Search,
  ShieldAlert,
  Calendar,
  Award,
  Check,
  AlertTriangle,
  SlidersHorizontal,
  Printer,
  Copy,
  Share2,
  ChevronDown,
  Users,
  Grab
} from 'lucide-react';
import { initial150StudentsList } from '../../data/mock150Students';
import { Student } from '../../types';
import { SkeletonTable, SkeletonStatCard } from '../common/Skeleton';

type AttendanceStatusCell = 'P' | 'A' | 'L' | 'EX' | '-';

interface DateColumn {
  dayNum: number;
  dayName: string;
  dateStr: string;
  isToday?: boolean;
  month: string;
}

const ALL_MONTHS = [
  'June 2026',
  'July 2026',
  'August 2026',
  'September 2026',
  'October 2026'
];

// Master list of all subjects taught across SYBSc IT
const ALL_REAL_SUBJECTS = [
  { id: 'subj_ds', code: 'IT401', name: 'Data Structures & Algorithms', type: 'Core Theory', division: 'SYBSc IT - Div A', count: 64, color: '#12A176' },
  { id: 'subj_os', code: 'IT402', name: 'Operating Systems Architecture', type: 'Core Theory', division: 'SYBSc IT - Div A', count: 64, color: '#4E7FD6' },
  { id: 'subj_dbms', code: 'IT403', name: 'Advanced Database Systems', type: 'Core Theory', division: 'SYBSc IT - Div B', count: 58, color: '#12A176' },
  { id: 'subj_cn', code: 'IT404', name: 'Computer Networks & Security', type: 'Core Theory', division: 'SYBSc IT - Div B', count: 60, color: '#4E7FD6' },
  { id: 'subj_web', code: 'IT405', name: 'Modern Web Engineering', type: 'Core Lab', division: 'SYBSc IT - Div A', count: 55, color: '#E0A23B' },
  { id: 'subj_fl', code: 'OE101', name: 'Financial Literacy (OE)', type: 'Open Elective', division: 'SYBSc IT - Div C', count: 50, color: '#4E7FD6' },
  { id: 'subj_abm', code: 'OE102', name: 'Advertising & Brand Management (OE)', type: 'Open Elective', division: 'SYBSc IT - Div C', count: 100, color: '#12A176' }
];

// Convert raw 150 student roster items into standard Student models
const initialStudentsList: Student[] = initial150StudentsList.map((st) => ({
  id: st.id,
  rollNo: st.rollNo,
  name: st.name,
  className: `SYBSc IT - ${st.division || 'Div A'}`,
  avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23E5F5EE" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%2312A176" font-family="sans-serif" font-weight="900" font-size="28">${st.name.slice(0, 2).toUpperCase()}</text></svg>`,
  overallAttendance: st.overallAttendance,
  subjectAttendance: {
    subj_ds: st.overallAttendance,
    subj_os: st.overallAttendance - 2,
    subj_dbms: st.overallAttendance + 1,
    subj_cn: st.overallAttendance
  },
  isDefaulter: st.isDefaulter,
  statusTag: st.statusTag === 'Top Ranker' ? 'Excellent' : st.statusTag === 'Critical Defaulter' || st.statusTag === 'At Risk' ? 'Critical Defaulter' : 'Regular',
  contactEmail: st.contactEmail,
  parentPhone: st.parentPhone
}));

export const AttendanceSheetView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  // Filters & State
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['August 2026']);
  const [selectedSubjectObj, setSelectedSubjectObj] = useState(ALL_REAL_SUBJECTS[0]);
  const [selectedClass, setSelectedClass] = useState('All SYBSc IT (150 Roster)');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDefaultersOnly, setFilterDefaultersOnly] = useState(false);

  // Subject Dropdown Open State
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [subjectSearchFilter, setSubjectSearchFilter] = useState('');

  // Custom Defaulter Settings Engine
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [targetThreshold, setTargetThreshold] = useState<number>(75);
  const [onePresentPctWeight, setOnePresentPctWeight] = useState<number>(1.25);
  const [oneAbsentPctPenalty, setOneAbsentPctPenalty] = useState<number>(0.75);
  const [graceAllowancePct, setGraceAllowancePct] = useState<number>(0);
  const [customWeightMode, setCustomWeightMode] = useState<boolean>(false);

  // Sharing & Export Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrintNoticeOpen, setIsPrintNoticeOpen] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  // Waiver Modal
  const [waiverStudent, setWaiverStudent] = useState<Student | null>(null);
  const [waiverReason, setWaiverReason] = useState('Medical Certificate Submitted');

  // Days in selected months for lecture columns
  const [allDateColumns] = useState<DateColumn[]>([
    { dayNum: 1, dayName: 'Sat', dateStr: 'Aug 01', month: 'August 2026' },
    { dayNum: 3, dayName: 'Mon', dateStr: 'Aug 03', month: 'August 2026' },
    { dayNum: 4, dayName: 'Tue', dateStr: 'Aug 04', month: 'August 2026', isToday: true },
    { dayNum: 5, dayName: 'Wed', dateStr: 'Aug 05', month: 'August 2026' },
    { dayNum: 6, dayName: 'Thu', dateStr: 'Aug 06', month: 'August 2026' },
    { dayNum: 7, dayName: 'Fri', dateStr: 'Aug 07', month: 'August 2026' },
    { dayNum: 10, dayName: 'Mon', dateStr: 'Aug 10', month: 'August 2026' },
    { dayNum: 11, dayName: 'Tue', dateStr: 'Aug 11', month: 'August 2026' },
    { dayNum: 12, dayName: 'Wed', dateStr: 'Aug 12', month: 'August 2026' },
    { dayNum: 13, dayName: 'Thu', dateStr: 'Aug 13', month: 'August 2026' },
    { dayNum: 14, dayName: 'Fri', dateStr: 'Aug 14', month: 'August 2026' },
    { dayNum: 17, dayName: 'Mon', dateStr: 'Aug 17', month: 'August 2026' },
    { dayNum: 18, dayName: 'Tue', dateStr: 'Aug 18', month: 'August 2026' },
    { dayNum: 19, dayName: 'Wed', dateStr: 'Aug 19', month: 'August 2026' },
    { dayNum: 20, dayName: 'Thu', dateStr: 'Aug 20', month: 'August 2026' },
    { dayNum: 1, dayName: 'Wed', dateStr: 'Jul 01', month: 'July 2026' },
    { dayNum: 6, dayName: 'Mon', dateStr: 'Jul 06', month: 'July 2026' },
    { dayNum: 13, dayName: 'Mon', dateStr: 'Jul 13', month: 'July 2026' },
    { dayNum: 20, dayName: 'Mon', dateStr: 'Jul 20', month: 'July 2026' },
    { dayNum: 27, dayName: 'Mon', dateStr: 'Jul 27', month: 'July 2026' },
    { dayNum: 8, dayName: 'Mon', dateStr: 'Jun 08', month: 'June 2026' },
    { dayNum: 15, dayName: 'Mon', dateStr: 'Jun 15', month: 'June 2026' },
    { dayNum: 22, dayName: 'Mon', dateStr: 'Jun 22', month: 'June 2026' },
    { dayNum: 29, dayName: 'Mon', dateStr: 'Jun 29', month: 'June 2026' }
  ]);

  const activeColumns = allDateColumns.filter((col) => selectedMonths.includes(col.month));

  const [gridMatrix, setGridMatrix] = useState<Record<string, Record<string, AttendanceStatusCell>>>(() => {
    const initial: Record<string, Record<string, AttendanceStatusCell>> = {};
    initialStudentsList.forEach((student, sIdx) => {
      initial[student.id] = {};
      allDateColumns.forEach((col, idx) => {
        if (student.isDefaulter && (sIdx + idx) % 3 === 0) {
          initial[student.id][col.dateStr] = 'A';
        } else if ((sIdx + idx) % 7 === 2) {
          initial[student.id][col.dateStr] = 'L';
        } else {
          initial[student.id][col.dateStr] = 'P';
        }
      });
    });
    return initial;
  });

  const [students, setStudents] = useState<Student[]>(initialStudentsList);

  const handleCellClick = (studentId: string, dateStr: string) => {
    setGridMatrix((prev) => {
      const current = prev[studentId]?.[dateStr] || 'P';
      let next: AttendanceStatusCell = 'P';
      if (current === 'P') next = 'A';
      else if (current === 'A') next = 'L';
      else if (current === 'L') next = 'EX';
      else next = 'P';

      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [dateStr]: next
        }
      };
    });
  };

  const handleMarkDateAllPresent = (dateStr: string) => {
    setGridMatrix((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((studentId) => {
        updated[studentId] = {
          ...updated[studentId],
          [dateStr]: 'P'
        };
      });
      return updated;
    });
  };

  const toggleMonth = (m: string) => {
    if (selectedMonths.includes(m)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter((item) => item !== m));
      }
    } else {
      setSelectedMonths([...selectedMonths, m]);
    }
  };

  const selectAllMonths = () => {
    if (selectedMonths.length === ALL_MONTHS.length) {
      setSelectedMonths(['August 2026']);
    } else {
      setSelectedMonths([...ALL_MONTHS]);
    }
  };

  const handleGrantWaiver = () => {
    if (!waiverStudent) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === waiverStudent.id) {
          return {
            ...s,
            isDefaulter: false,
            overallAttendance: Math.max(s.overallAttendance, targetThreshold + 1),
            statusTag: 'Regular'
          };
        }
        return s;
      })
    );
    setWaiverStudent(null);
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tableContainerRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;

    setIsDragging(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setStartY(e.pageY - tableContainerRef.current.offsetTop);
    setScrollLeft(tableContainerRef.current.scrollLeft);
    setScrollTop(tableContainerRef.current.scrollTop);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const y = e.pageY - tableContainerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeft - walkX;
    tableContainerRef.current.scrollTop = scrollTop - walkY;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!tableContainerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setStartX(touch.pageX - tableContainerRef.current.offsetLeft);
    setStartY(touch.pageY - tableContainerRef.current.offsetTop);
    setScrollLeft(tableContainerRef.current.scrollLeft);
    setScrollTop(tableContainerRef.current.scrollTop);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!tableContainerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const x = touch.pageX - tableContainerRef.current.offsetLeft;
    const y = touch.pageY - tableContainerRef.current.offsetTop;
    const walkX = (x - startX) * 1.2;
    const walkY = (y - startY) * 1.2;
    tableContainerRef.current.scrollLeft = scrollLeft - walkX;
    tableContainerRef.current.scrollTop = scrollTop - walkY;
  };

  const calculateStudentStats = (student: Student) => {
    const studentCells = gridMatrix[student.id] || {};
    const cols = activeColumns.length > 0 ? activeColumns : allDateColumns;
    const totalConducted = cols.length;

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    cols.forEach((col) => {
      const status = studentCells[col.dateStr] || 'P';
      if (status === 'P' || status === 'EX') {
        presentCount += 1;
      } else if (status === 'L') {
        presentCount += 0.5;
        lateCount += 1;
      } else if (status === 'A') {
        absentCount += 1;
      }
    });

    let calculatedPct = 0;
    if (customWeightMode) {
      const score = presentCount * onePresentPctWeight - absentCount * oneAbsentPctPenalty + graceAllowancePct;
      calculatedPct = Math.max(0, Math.min(100, Math.round(score)));
    } else {
      calculatedPct = Math.min(100, Math.round(((presentCount) / (totalConducted || 1)) * 100 + graceAllowancePct));
    }

    const isDefaulter = calculatedPct < targetThreshold;

    let deficitLectures = 0;
    if (calculatedPct < targetThreshold && targetThreshold < 100) {
      const numerator = (targetThreshold * totalConducted) - (100 * presentCount);
      const denominator = 100 - targetThreshold;
      deficitLectures = Math.max(0, Math.ceil(numerator / denominator));
    }

    return {
      totalConducted,
      presentCount,
      absentCount,
      lateCount,
      calculatedPct,
      isDefaulter,
      deficitLectures
    };
  };

  const processedStudents = students.map((s) => {
    const stats = calculateStudentStats(s);
    return {
      ...s,
      dynamicStats: stats
    };
  });

  const filteredStudents = processedStudents.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      selectedClass.includes('150 Roster') ||
      (selectedClass.includes('Div A') && s.className.includes('Div A')) ||
      (selectedClass.includes('Div B') && s.className.includes('Div B')) ||
      (selectedClass.includes('Div C') && s.className.includes('Div C'));

    if (filterDefaultersOnly) return matchesSearch && matchesClass && s.dynamicStats.isDefaulter;
    return matchesSearch && matchesClass;
  });

  const defaultersList = processedStudents.filter((s) => s.dynamicStats.isDefaulter);

  const getWhatsAppNoticeText = () => {
    const subjectTitle = selectedSubjectObj.name;
    const monthListStr = selectedMonths.join(', ');

    let notice = `📢 *OFFICIAL DEFAULTER ATTENDANCE NOTICE*\n`;
    notice += `🏫 *Class:* ${selectedClass}\n`;
    notice += `📚 *Subject:* ${subjectTitle}\n`;
    notice += `📅 *Period:* ${monthListStr}\n`;
    notice += `🎯 *Minimum Required:* ${targetThreshold}%\n\n`;

    if (defaultersList.length === 0) {
      notice += `✅ *Great news! No defaulters flagged for this period.* All students have >= ${targetThreshold}% attendance.`;
    } else {
      notice += `🚨 *DEFAULTER STUDENTS (< ${targetThreshold}%):*\n`;
      defaultersList.forEach((st, idx) => {
        notice += `${idx + 1}. *Roll #${st.rollNo}* - ${st.name}: *${st.dynamicStats.calculatedPct}%* (Deficit: ${st.dynamicStats.deficitLectures} lectures needed)\n`;
      });
      notice += `\n⚠️ *Action Required:* Above students must report to the Class Coordinator immediately before term clearance.`;
    }

    return notice;
  };

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(getWhatsAppNoticeText());
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Roll No',
      'Student Name',
      'Class',
      'Attended Sessions',
      'Total Conducted',
      'Attendance %',
      'Threshold %',
      'Status',
      'Deficit Lectures Needed',
      ...activeColumns.map((c) => `${c.dateStr} (${c.month})`)
    ];

    const rows = filteredStudents.map((s) => {
      const studentCells = gridMatrix[s.id] || {};
      const rowData = [
        s.rollNo,
        `"${s.name}"`,
        `"${s.className}"`,
        s.dynamicStats.presentCount,
        s.dynamicStats.totalConducted,
        `${s.dynamicStats.calculatedPct}%`,
        `${targetThreshold}%`,
        s.dynamicStats.isDefaulter ? 'DEFAULTER' : 'REGULAR',
        s.dynamicStats.deficitLectures,
        ...activeColumns.map((c) => studentCells[c.dateStr] || 'P')
      ];
      return rowData.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${selectedClass.replace(/\s+/g, '_')}_${selectedMonths.join('_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#14201B] pb-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <SkeletonTable rows={10} cols={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#14201B] pb-28">
      {/* ================= HEADER CONTROL BAR ================= */}
      <div className="p-6 rounded-2xl bg-white border border-[#DCEAE3] shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#E5F5EE] flex items-center justify-center text-[#12A176]">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#14201B] tracking-tight">
                Multi-Month Attendance & Defaulter Engine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E5F5EE] text-[#12A176] text-[10px] font-bold uppercase">
                Custom Criteria
              </span>
            </div>
            <p className="text-xs text-[#5C6B63] font-medium mt-0.5">
              Multi-month aggregated matrix, custom defaulter thresholds ({targetThreshold}%), deficit lecture calculator, and group sharing tools.
            </p>
          </div>
        </div>

        {/* Action Controls & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#F8FDFB] text-[#14201B] border border-[#DCEAE3] hover:bg-[#E5F5EE] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#12A176]" />
            <span>Criteria ({targetThreshold}%)</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#4E7FD6]/10 text-[#4E7FD6] border border-[#4E7FD6]/20 hover:bg-[#4E7FD6]/20 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Defaulter Notice</span>
          </button>

          <button
            onClick={() => setFilterDefaultersOnly(!filterDefaultersOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterDefaultersOnly
                ? 'bg-[#DB5B4E] text-white border-[#DB5B4E] shadow-sm'
                : 'bg-[#F8FDFB] text-[#14201B] border-[#DCEAE3] hover:bg-[#E5F5EE]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{filterDefaultersOnly ? `Showing <${targetThreshold}%` : 'Filter Defaulters'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{exportedSuccess ? '✓ CSV Exported!' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* ================= MULTI-MONTH & SUBJECT SELECTOR PANEL ================= */}
      <div className="p-5 rounded-2xl bg-white border border-[#DCEAE3] shadow-sm space-y-4">
        {/* Row 1: Month Selection Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#14201B] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#12A176]" /> Select Term Months to Include:
            </span>
            <button
              onClick={selectAllMonths}
              className="text-xs font-semibold text-[#12A176] hover:underline cursor-pointer"
            >
              {selectedMonths.length === ALL_MONTHS.length ? 'Reset to August' : '✓ Select All Semester Months'}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {ALL_MONTHS.map((m) => {
              const isSel = selectedMonths.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleMonth(m)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-[#12A176] text-white border-[#12A176] shadow-sm'
                      : 'bg-[#F8FDFB] text-[#5C6B63] border-[#DCEAE3] hover:text-[#14201B]'
                  }`}
                >
                  {isSel && <Check className="w-3.5 h-3.5 text-white" />}
                  <span>{m}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Clean Custom Subject & Class Selector */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-3 border-t border-[#DCEAE3]">
          <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
            {/* Custom Subject Selector Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="bg-[#14201B] hover:bg-[#1f3029] text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 shadow-sm cursor-pointer border border-[#DCEAE3]"
              >
                <span
                  className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: selectedSubjectObj.color }}
                >
                  {selectedSubjectObj.code}
                </span>
                <span className="truncate max-w-[200px]">{selectedSubjectObj.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSubjectDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-white border border-[#DCEAE3] rounded-2xl shadow-xl p-3 space-y-2 text-[#14201B]">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-[#5C6B63] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search subject by code or name..."
                      value={subjectSearchFilter}
                      onChange={(e) => setSubjectSearchFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-medium text-[#14201B] placeholder-[#5C6B63] focus:outline-none focus:border-[#12A176]"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {ALL_REAL_SUBJECTS.filter((s) =>
                      s.name.toLowerCase().includes(subjectSearchFilter.toLowerCase()) ||
                      s.code.toLowerCase().includes(subjectSearchFilter.toLowerCase())
                    ).map((subj) => {
                      const isSel = subj.id === selectedSubjectObj.id;
                      return (
                        <div
                          key={subj.id}
                          onClick={() => {
                            setSelectedSubjectObj(subj);
                            setIsSubjectDropdownOpen(false);
                          }}
                          className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                            isSel
                              ? 'bg-[#E5F5EE] border border-[#12A176] text-[#12A176] font-semibold'
                              : 'hover:bg-[#F8FDFB] text-[#14201B]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: subj.color }}
                            >
                              {subj.code}
                            </span>
                            <div className="truncate">
                              <span className="text-xs font-semibold block truncate">{subj.name}</span>
                              <span className="text-[10px] text-[#5C6B63]">{subj.type} • {subj.count} Students</span>
                            </div>
                          </div>
                          {isSel && <Check className="w-4 h-4 text-[#12A176] shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Class Scope Selector */}
            <div className="flex items-center gap-1.5 bg-[#F8FDFB] px-3 py-2 rounded-xl border border-[#DCEAE3]">
              <Users className="w-3.5 h-3.5 text-[#12A176]" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#14201B] focus:outline-none cursor-pointer"
              >
                <option value="All SYBSc IT (150 Roster)">All SYBSc IT (150 Roster)</option>
                <option value="SYBSc IT - Div A">Div A (64 Students)</option>
                <option value="SYBSc IT - Div B">Div B (58 Students)</option>
                <option value="SYBSc IT - Div C">Div C (50 Students)</option>
              </select>
            </div>

            {/* Active Defaulters Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-[#DB5B4E]/10 border border-[#DB5B4E]/20 text-[#DB5B4E] text-xs font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{defaultersList.length} Defaulters (&lt;{targetThreshold}%)</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-64">
            <Search className="w-3.5 h-3.5 text-[#5C6B63] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-xs text-[#14201B] placeholder-[#5C6B63] focus:outline-none focus:ring-2 focus:ring-[#12A176] font-medium"
            />
          </div>
        </div>
      </div>

      {/* ================= SPREADSHEET MATRIX TABLE WITH CLICK & DRAG/SWIPE ================= */}
      <div className="p-5 rounded-2xl bg-white border border-[#DCEAE3] shadow-sm overflow-hidden">
        {/* Cell Key Legend & Drag Hint */}
        <div className="flex items-center justify-between gap-2 pb-4 mb-3 border-b border-[#DCEAE3] flex-wrap text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-[#14201B]">Cell Key:</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#E5F5EE] text-[#12A176] font-bold text-[11px] border border-[#12A176]/30">
              P = Present
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#DB5B4E] text-white font-bold text-[11px]">
              A = Absent
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#E0A23B]/15 text-[#E0A23B] border border-[#E0A23B]/30 font-bold text-[11px]">
              L = Late (0.5)
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#4E7FD6]/15 text-[#4E7FD6] border border-[#4E7FD6]/30 font-bold text-[11px]">
              EX = Excused
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#12A176] font-semibold bg-[#E5F5EE] px-3 py-1 rounded-full border border-[#DCEAE3]">
            <Grab className="w-3.5 h-3.5" />
            <span>Click & Left-Swipe or Drag sheet horizontally/vertically</span>
          </div>
        </div>

        {/* Scrollable Spreadsheet Container */}
        <div
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className={`overflow-x-auto max-w-full rounded-xl border border-[#DCEAE3] max-h-[600px] select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <table className="w-full text-left border-collapse font-sans min-w-[950px]">
            <thead>
              <tr className="bg-[#14201B] text-white text-[11px] font-semibold uppercase tracking-wider">
                <th className="p-3 sticky left-0 z-20 bg-[#14201B] min-w-[80px] border-r border-white/10">
                  Roll No
                </th>
                <th className="p-3 sticky left-[80px] z-20 bg-[#14201B] min-w-[180px] border-r border-white/10">
                  Student Name
                </th>
                <th className="p-3 min-w-[100px] text-center border-r border-white/10">Attended / Total</th>
                <th className="p-3 min-w-[90px] text-center border-r border-white/10">Attendance %</th>
                <th className="p-3 min-w-[110px] text-center border-r border-white/10">Status</th>
                <th className="p-3 min-w-[110px] text-center border-r border-white/10 text-[#E5F5EE]">Deficit Lectures</th>

                {activeColumns.map((col) => (
                  <th
                    key={col.dateStr}
                    className={`p-2.5 min-w-[60px] text-center border-r border-white/10 ${
                      col.isToday ? 'bg-[#12A176] text-white' : ''
                    }`}
                  >
                    <div className="text-[9px] opacity-70 font-mono uppercase">{col.dayName}</div>
                    <div className="font-bold text-xs">{col.dayNum}</div>
                    <button
                      onClick={() => handleMarkDateAllPresent(col.dateStr)}
                      title={`Mark all present for ${col.dateStr}`}
                      className="mt-1 text-[9px] px-1 py-0.2 rounded bg-white/10 hover:bg-white/20 text-[#E5F5EE] block mx-auto cursor-pointer"
                    >
                      All P
                    </button>
                  </th>
                ))}

                <th className="p-3 min-w-[120px] text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#DCEAE3] text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + 7} className="p-8 text-center text-[#5C6B63]">
                    No students match the selected search query or defaulter filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const studentCells = gridMatrix[student.id] || {};
                  const { presentCount, totalConducted, calculatedPct, isDefaulter, deficitLectures } =
                    student.dynamicStats;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-[#E5F5EE]/40 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FDFB]'
                      }`}
                    >
                      <td className="p-3 sticky left-0 z-10 bg-inherit font-mono font-semibold text-[#14201B] border-r border-[#DCEAE3]">
                        {student.rollNo}
                      </td>

                      <td className="p-3 sticky left-[80px] z-10 bg-inherit border-r border-[#DCEAE3]">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-7 h-7 rounded-lg object-cover border border-[#DCEAE3]"
                          />
                          <div>
                            <span className="font-semibold text-[#14201B] block leading-tight">{student.name}</span>
                            <span className="text-[10px] text-[#5C6B63] font-medium">{student.className}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center font-mono font-medium text-[#5C6B63] border-r border-[#DCEAE3]">
                        {presentCount} / {totalConducted}
                      </td>

                      <td className="p-3 text-center border-r border-[#DCEAE3]">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                            calculatedPct >= targetThreshold
                              ? 'bg-[#E5F5EE] text-[#12A176] border border-[#12A176]/30'
                              : 'bg-[#DB5B4E] text-white'
                          }`}
                        >
                          {calculatedPct}%
                        </span>
                      </td>

                      <td className="p-3 text-center border-r border-[#DCEAE3]">
                        {isDefaulter ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DB5B4E] text-white text-[10px] font-bold uppercase shadow-sm">
                            <AlertTriangle className="w-3 h-3" /> Defaulter
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E5F5EE] text-[#12A176] text-[10px] font-bold border border-[#12A176]/20">
                            <Check className="w-3 h-3 text-[#12A176]" /> Regular
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center border-r border-[#DCEAE3]">
                        {isDefaulter ? (
                          <span className="font-mono font-bold text-xs text-[#DB5B4E]">
                            +{deficitLectures} needed
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#12A176] font-semibold">✓ Safe</span>
                        )}
                      </td>

                      {activeColumns.map((col) => {
                        const cellVal = studentCells[col.dateStr] || 'P';
                        let badgeBg = 'bg-[#E5F5EE] text-[#12A176] font-bold border border-[#12A176]/20';
                        if (cellVal === 'A') badgeBg = 'bg-[#DB5B4E] text-white font-bold shadow-sm';
                        else if (cellVal === 'L') badgeBg = 'bg-[#E0A23B] text-white font-bold';
                        else if (cellVal === 'EX') badgeBg = 'bg-[#4E7FD6] text-white font-bold';

                        return (
                          <td
                            key={col.dateStr}
                            onClick={() => handleCellClick(student.id, col.dateStr)}
                            className="p-1.5 text-center border-r border-[#DCEAE3] cursor-pointer hover:bg-[#E5F5EE] select-none transition-all"
                          >
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs transition-transform active:scale-90 ${badgeBg}`}
                            >
                              {cellVal}
                            </span>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center">
                        {isDefaulter ? (
                          <button
                            onClick={() => setWaiverStudent(student)}
                            className="px-2.5 py-1 rounded-lg bg-[#12A176]/10 hover:bg-[#12A176]/20 text-[#12A176] text-[10px] font-bold border border-[#12A176]/20 transition-colors cursor-pointer"
                          >
                            Exempt / Waiver
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#5C6B63] font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: CUSTOM DEFAULTER SETTINGS DRAWER ================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 bg-[#14201B]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#DCEAE3] p-6 w-full max-w-lg shadow-xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#DCEAE3]">
                <div className="flex items-center gap-2 text-[#14201B]">
                  <SlidersHorizontal className="w-5 h-5 text-[#12A176]" />
                  <h3 className="font-bold text-base">
                    Custom Defaulter Calculation Rules
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-[#5C6B63] hover:text-[#14201B] font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#14201B]">
                    Defaulter Threshold Target (%):
                  </label>
                  <span className="px-3 py-1 rounded-full bg-[#12A176] text-white font-mono font-bold text-xs">
                    {targetThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={90}
                  step={1}
                  value={targetThreshold}
                  onChange={(e) => setTargetThreshold(Number(e.target.value))}
                  className="w-full accent-[#12A176] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#5C6B63] font-mono">
                  <span>50% (Lenient)</span>
                  <span>75% (Standard)</span>
                  <span>85% (Strict)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#14201B]">Custom Session Weightage</h4>
                    <p className="text-[11px] text-[#5C6B63]">
                      e.g., 1 Present session = X% direct credit toward final grade.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={customWeightMode}
                    onChange={(e) => setCustomWeightMode(e.target.checked)}
                    className="w-4 h-4 accent-[#12A176] cursor-pointer"
                  />
                </div>

                {customWeightMode && (
                  <div className="pt-2 space-y-3 border-t border-[#DCEAE3]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#14201B]">
                        1 Present Session Credit (+%):
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.5"
                        max="5"
                        value={onePresentPctWeight}
                        onChange={(e) => setOnePresentPctWeight(Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-[#DCEAE3] rounded-lg text-xs font-bold font-mono text-center text-[#12A176]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#14201B]">
                        1 Absent Session Penalty (-%):
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="5"
                        value={oneAbsentPctPenalty}
                        onChange={(e) => setOneAbsentPctPenalty(Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-[#DCEAE3] rounded-lg text-xs font-bold font-mono text-center text-[#DB5B4E]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#14201B] block">
                  College Grace Allowance (Sports / NSS % Add-on):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={graceAllowancePct}
                    onChange={(e) => setGraceAllowancePct(Number(e.target.value))}
                    className="w-24 p-2 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-bold font-mono text-center text-[#14201B]"
                  />
                  <span className="text-xs text-[#5C6B63] font-medium">% added to overall score</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-3 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save Criteria & Recalculate Matrix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 2: WHATSAPP & GROUP NOTICE SHARE MODAL ================= */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#14201B]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#DCEAE3] p-6 w-full max-w-lg shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#DCEAE3]">
                <div className="flex items-center gap-2 text-[#14201B]">
                  <Share2 className="w-5 h-5 text-[#12A176]" />
                  <h3 className="font-bold text-base">
                    Share Defaulter Notice to Class Group
                  </h3>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-[#5C6B63] hover:text-[#14201B] font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#5C6B63] font-medium">
                Copy formatted WhatsApp/Telegram notice or print an official departmental memo with 1-click.
              </p>

              <div className="p-3.5 rounded-xl bg-[#14201B] text-[#E5F5EE] font-mono text-xs leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap border border-[#DCEAE3] select-all">
                {getWhatsAppNoticeText()}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={handleCopyWhatsAppText}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedNotice ? '✓ Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsShareModalOpen(false);
                    setIsPrintNoticeOpen(true);
                  }}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-[#14201B] hover:bg-[#1f3029] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#12A176]" />
                  <span>Print Formal Memo</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 3: FORMAL PRINTABLE NOTICE MODAL ================= */}
      <AnimatePresence>
        {isPrintNoticeOpen && (
          <div className="fixed inset-0 z-50 bg-[#14201B]/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#DCEAE3] p-8 w-full max-w-2xl shadow-xl space-y-6 my-8 text-[#14201B]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#DCEAE3] print:hidden">
                <span className="text-xs font-bold text-[#12A176] uppercase tracking-wider">
                  Official Printable Document
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-[#12A176] text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setIsPrintNoticeOpen(false)}
                    className="px-3 py-2 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-[#14201B] text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="text-center space-y-1 border-b-2 border-[#14201B] pb-4">
                <h1 className="text-lg font-bold tracking-tight uppercase">
                  DEPARTMENT OF INFORMATION TECHNOLOGY
                </h1>
                <p className="text-xs font-semibold text-[#5C6B63]">CAMPUS FACULTY PLATFORM • ATTENDANCE CELL</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#5C6B63] pt-2">
                  <span>Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
                  <span>Ref No: IT/ATT/2026/DEF-04</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-base font-bold underline tracking-tight uppercase">
                  OFFICIAL ATTENDANCE DEFAULTER NOTICE (&lt; {targetThreshold}%)
                </h2>
                <p className="text-xs font-semibold text-[#5C6B63]">
                  Class: {selectedClass} • Period: {selectedMonths.join(', ')}
                </p>
              </div>

              <div className="border border-[#14201B] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#14201B] text-white font-semibold text-[11px] uppercase">
                    <tr>
                      <th className="p-2.5">Roll No</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5 text-center">Attendance %</th>
                      <th className="p-2.5 text-center">Deficit Lectures Needed</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCEAE3]">
                    {defaultersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-[#5C6B63]">
                          No defaulter students flagged for the selected evaluation period.
                        </td>
                      </tr>
                    ) : (
                      defaultersList.map((st) => (
                        <tr key={st.id}>
                          <td className="p-2.5 font-mono font-bold">{st.rollNo}</td>
                          <td className="p-2.5 font-semibold">{st.name}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-[#DB5B4E]">
                            {st.dynamicStats.calculatedPct}%
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">
                            +{st.dynamicStats.deficitLectures}
                          </td>
                          <td className="p-2.5 text-center font-bold text-[#DB5B4E]">DEFAULTER</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-12 flex items-center justify-between text-xs font-semibold text-[#14201B]">
                <div className="text-center space-y-8">
                  <div className="border-b border-[#14201B] w-40 mx-auto" />
                  <p>Class Teacher Coordinator</p>
                </div>
                <div className="text-center space-y-8">
                  <div className="border-b border-[#14201B] w-40 mx-auto" />
                  <p>Head of Department (IT)</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 4: DEFAULTER WAIVER POPUP ================= */}
      <AnimatePresence>
        {waiverStudent && (
          <div className="fixed inset-0 z-50 bg-[#14201B]/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#DCEAE3] p-6 w-full max-w-md shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#DCEAE3]">
                <div className="flex items-center gap-2 text-[#14201B]">
                  <Award className="w-5 h-5 text-[#12A176]" />
                  <h3 className="font-bold text-base">Grant Attendance Waiver</h3>
                </div>
                <button
                  onClick={() => setWaiverStudent(null)}
                  className="text-[#5C6B63] hover:text-[#14201B] font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] flex items-center gap-3">
                <img src={waiverStudent.avatar} alt={waiverStudent.name} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-sm text-[#14201B]">{waiverStudent.name}</h4>
                  <p className="text-xs text-[#5C6B63]">Roll: {waiverStudent.rollNo} • Current: {waiverStudent.overallAttendance}%</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#14201B] block mb-1">Reason for Exemption / Waiver</label>
                <select
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F8FDFB] border border-[#DCEAE3] text-xs font-semibold text-[#14201B] focus:outline-none focus:border-[#12A176]"
                >
                  <option value="Medical Certificate Submitted">Medical Certificate Submitted (Approved by Dean)</option>
                  <option value="Inter-College Sports Duty">Inter-College Sports Duty Exemption</option>
                  <option value="Special Academic Research Duty">Special Academic Research Exemption</option>
                  <option value="Attendance Recalculation Correction">Attendance Recalculation Correction</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setWaiverStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#F8FDFB] hover:bg-[#E5F5EE] text-[#14201B] text-xs font-bold border border-[#DCEAE3]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrantWaiver}
                  className="flex-1 py-2.5 rounded-xl bg-[#12A176] hover:bg-[#0E8360] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Grant Exemption
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 1: CUSTOM DEFAULTER SETTINGS DRAWER ================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 bg-[#1A1025]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E8E3D9] p-6 w-full max-w-lg shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D9]">
                <div className="flex items-center gap-2 text-[#1A1025]">
                  <SlidersHorizontal className="w-5 h-5 text-[#8B5CF6]" />
                  <h3 className="font-black text-base font-['Plus_Jakarta_Sans']">
                    Custom Defaulter Calculation Rules
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-[#6B6478] hover:text-[#1A1025] font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Target Percentage Threshold Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1A1025]">
                    Defaulter Threshold Target (%):
                  </label>
                  <span className="px-3 py-1 rounded-full bg-[#8B5CF6] text-white font-mono font-black text-xs">
                    {targetThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={90}
                  step={1}
                  value={targetThreshold}
                  onChange={(e) => setTargetThreshold(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6B6478] font-mono">
                  <span>50% (Lenient)</span>
                  <span>75% (Standard)</span>
                  <span>85% (Strict)</span>
                </div>
              </div>

              {/* Custom Weighting Mode Toggle */}
              <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E8E3D9] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#1A1025]">Custom Session Weightage</h4>
                    <p className="text-[11px] text-[#6B6478]">
                      e.g., 1 Present session = X% direct credit toward final grade.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={customWeightMode}
                    onChange={(e) => setCustomWeightMode(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6] cursor-pointer"
                  />
                </div>

                {customWeightMode && (
                  <div className="pt-2 space-y-3 border-t border-[#E8E3D9]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#1A1025]">
                        1 Present Session Credit (+%):
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.5"
                        max="5"
                        value={onePresentPctWeight}
                        onChange={(e) => setOnePresentPctWeight(Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-[#E8E3D9] rounded-lg text-xs font-bold font-mono text-center text-[#10B981]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#1A1025]">
                        1 Absent Session Penalty (-%):
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="5"
                        value={oneAbsentPctPenalty}
                        onChange={(e) => setOneAbsentPctPenalty(Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-[#E8E3D9] rounded-lg text-xs font-bold font-mono text-center text-[#F43F5E]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Grace Allowance Percentage */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1A1025] block">
                  College Grace Allowance (Sports / NSS % Add-on):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={graceAllowancePct}
                    onChange={(e) => setGraceAllowancePct(Number(e.target.value))}
                    className="w-24 p-2 bg-[#FBF9F4] border border-[#E8E3D9] rounded-xl text-xs font-bold font-mono text-center"
                  />
                  <span className="text-xs text-[#6B6478] font-medium">% added to overall score</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-3 rounded-2xl bg-[#1A1025] hover:bg-[#2A1B3B] text-white text-xs font-extrabold shadow-md cursor-pointer"
                >
                  Save Criteria & Recalculate Matrix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 2: WHATSAPP & GROUP NOTICE SHARE MODAL ================= */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#1A1025]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E8E3D9] p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D9]">
                <div className="flex items-center gap-2 text-[#1A1025]">
                  <Share2 className="w-5 h-5 text-[#8B5CF6]" />
                  <h3 className="font-black text-base font-['Plus_Jakarta_Sans']">
                    Share Defaulter Notice to Class Group
                  </h3>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-[#6B6478] hover:text-[#1A1025] font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#6B6478] font-medium">
                Copy formatted WhatsApp/Telegram notice or print an official departmental memo with 1-click.
              </p>

              {/* Notice Textarea Preview */}
              <div className="p-3.5 rounded-2xl bg-[#1A1025] text-[#A3E635] font-mono text-xs leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap border border-white/10 select-all">
                {getWhatsAppNoticeText()}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={handleCopyWhatsAppText}
                  className="w-full sm:flex-1 py-3 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedNotice ? '✓ Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsShareModalOpen(false);
                    setIsPrintNoticeOpen(true);
                  }}
                  className="w-full sm:flex-1 py-3 rounded-2xl bg-[#1A1025] hover:bg-[#2A1B3B] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#A3E635]" />
                  <span>Print Formal Memo</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 3: FORMAL PRINTABLE NOTICE MODAL ================= */}
      <AnimatePresence>
        {isPrintNoticeOpen && (
          <div className="fixed inset-0 z-50 bg-[#1A1025]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E8E3D9] p-8 w-full max-w-2xl shadow-2xl space-y-6 my-8 text-[#1A1025]"
            >
              {/* Header Print Actions */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E3D9] print:hidden">
                <span className="text-xs font-extrabold text-[#8B5CF6] uppercase tracking-wider">
                  Official Printable Document
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setIsPrintNoticeOpen(false)}
                    className="px-3 py-2 rounded-xl bg-[#FBF9F4] border border-[#E8E3D9] text-[#1A1025] text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* FORMAL DEPARTMENT LETTERHEAD */}
              <div className="text-center space-y-1 border-b-2 border-[#1A1025] pb-4">
                <h1 className="text-lg font-black tracking-tight uppercase">
                  DEPARTMENT OF INFORMATION TECHNOLOGY
                </h1>
                <p className="text-xs font-bold text-[#6B6478]">CAMPUS FACULTY PLATFORM • ATTENDANCE CELL</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6478] pt-2">
                  <span>Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
                  <span>Ref No: IT/ATT/2026/DEF-04</span>
                </div>
              </div>

              {/* NOTICE TITLE */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-black underline tracking-tight uppercase">
                  OFFICIAL ATTENDANCE DEFAULTER NOTICE (&lt; {targetThreshold}%)
                </h2>
                <p className="text-xs font-semibold text-[#6B6478]">
                  Class: {selectedClass} • Period: {selectedMonths.join(', ')}
                </p>
              </div>

              {/* DEFAULTER TABLE */}
              <div className="border border-[#1A1025] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#1A1025] text-white font-bold text-[11px] uppercase">
                    <tr>
                      <th className="p-2.5">Roll No</th>
                      <th className="p-2.5">Student Name</th>
                      <th className="p-2.5 text-center">Attendance %</th>
                      <th className="p-2.5 text-center">Deficit Lectures Needed</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E3D9]">
                    {defaultersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-[#6B6478]">
                          No defaulter students flagged for the selected evaluation period.
                        </td>
                      </tr>
                    ) : (
                      defaultersList.map((st) => (
                        <tr key={st.id}>
                          <td className="p-2.5 font-mono font-bold">{st.rollNo}</td>
                          <td className="p-2.5 font-bold">{st.name}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-[#F43F5E]">
                            {st.dynamicStats.calculatedPct}%
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">
                            +{st.dynamicStats.deficitLectures}
                          </td>
                          <td className="p-2.5 text-center font-bold text-[#F43F5E]">DEFAULTER</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* SIGNATURE SECTION */}
              <div className="pt-12 flex items-center justify-between text-xs font-bold text-[#1A1025]">
                <div className="text-center space-y-8">
                  <div className="border-b border-[#1A1025] w-40 mx-auto" />
                  <p>Class Teacher Coordinator</p>
                </div>
                <div className="text-center space-y-8">
                  <div className="border-b border-[#1A1025] w-40 mx-auto" />
                  <p>Head of Department (IT)</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 4: DEFAULTER WAIVER POPUP ================= */}
      <AnimatePresence>
        {waiverStudent && (
          <div className="fixed inset-0 z-50 bg-[#1A1025]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E8E3D9] p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E3D9]">
                <div className="flex items-center gap-2 text-[#1A1025]">
                  <Award className="w-5 h-5 text-[#8B5CF6]" />
                  <h3 className="font-bold text-base font-['Plus_Jakarta_Sans']">Grant Attendance Waiver</h3>
                </div>
                <button
                  onClick={() => setWaiverStudent(null)}
                  className="text-[#6B6478] hover:text-[#1A1025] font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E8E3D9] flex items-center gap-3">
                <img src={waiverStudent.avatar} alt={waiverStudent.name} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-sm text-[#1A1025]">{waiverStudent.name}</h4>
                  <p className="text-xs text-[#6B6478]">Roll: {waiverStudent.rollNo} • Current: {waiverStudent.overallAttendance}%</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1025] block mb-1">Reason for Exemption / Waiver</label>
                <select
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FBF9F4] border border-[#E8E3D9] text-xs font-semibold text-[#1A1025] focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="Medical Certificate Submitted">Medical Certificate Submitted (Approved by Dean)</option>
                  <option value="Inter-College Sports Duty">Inter-College Sports Duty Exemption</option>
                  <option value="Special Academic Research Duty">Special Academic Research Exemption</option>
                  <option value="Attendance Recalculation Correction">Attendance Recalculation Correction</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setWaiverStudent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FBF9F4] hover:bg-[#E8E3D9]/50 text-[#1A1025] text-xs font-bold border border-[#E8E3D9]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrantWaiver}
                  className="flex-1 py-2.5 rounded-xl bg-[#1A1025] hover:bg-[#2A1B3B] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Grant Exemption
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
