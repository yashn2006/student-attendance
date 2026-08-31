import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Clock,
  AlertTriangle,
  Send,
  UserCheck,
  Calendar,
  Plus,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Megaphone,
  Briefcase,
  FileSpreadsheet,
  Zap,
  Sparkles,
  Award,
  ChevronDown,
  Check,
  Search,
  BookOpen,
  Users,
  ShieldCheck,
  Activity,
  MapPin,
  Layers,
  BarChart3
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useSession } from '../../context/SessionContext';
import { mockRecentActivities, mockAssignments, mockTimetable } from '../../data/mockData';
import { SkeletonDashboardView } from '../common/Skeleton';

interface DashboardViewProps {
  onNavigateTab: (tabId: string) => void;
  onOpenActionModal: (type: 'announcement' | 'attendance' | 'leave') => void;
}

// Master list of all subjects taught across SYBSc IT
const realSubjectsList = [
  {
    id: 'subj_ds',
    code: 'IT401',
    name: 'Data Structures & Algorithms',
    type: 'Core Subject',
    defaultDivision: 'SYBSc IT - Div A',
    defaultRoom: 'Room 402',
    studentsCount: 64,
    color: '#12A176'
  },
  {
    id: 'subj_os',
    code: 'IT402',
    name: 'Operating Systems Architecture',
    type: 'Core Subject',
    defaultDivision: 'SYBSc IT - Div A',
    defaultRoom: 'Lab 2',
    studentsCount: 64,
    color: '#4E7FD6'
  },
  {
    id: 'subj_dbms',
    code: 'IT403',
    name: 'Advanced Database Systems',
    type: 'Core Subject',
    defaultDivision: 'SYBSc IT - Div B',
    defaultRoom: 'Room 402',
    studentsCount: 58,
    color: '#12A176'
  },
  {
    id: 'subj_cn',
    code: 'IT404',
    name: 'Computer Networks & Security',
    type: 'Core Subject',
    defaultDivision: 'SYBSc IT - Div B',
    defaultRoom: 'Lab 1',
    studentsCount: 60,
    color: '#4E7FD6'
  },
  {
    id: 'subj_web',
    code: 'IT405',
    name: 'Modern Web Engineering',
    type: 'Core Lab',
    defaultDivision: 'SYBSc IT - Div A',
    defaultRoom: 'Lab 3',
    studentsCount: 55,
    color: '#E0A23B'
  },
  {
    id: 'subj_fl',
    code: 'OE101',
    name: 'Financial Literacy (OE)',
    type: 'Open Elective',
    defaultDivision: 'SYBSc IT - Div C',
    defaultRoom: 'Seminar Hall B',
    studentsCount: 50,
    color: '#12A176'
  },
  {
    id: 'subj_abm',
    code: 'OE102',
    name: 'Advertising & Brand Management (OE)',
    type: 'Open Elective',
    defaultDivision: 'SYBSc IT - Div C',
    defaultRoom: 'Auditorium 1',
    studentsCount: 100,
    color: '#4E7FD6'
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onOpenActionModal }) => {
  const { user } = useAuth();
  const { startSession } = useSession();

  const [isLoading, setIsLoading] = useState(true);

  // Selected state for session launch
  const [selectedSubjectObj, setSelectedSubjectObj] = useState(realSubjectsList[0]);
  const [selectedBatch, setSelectedBatch] = useState(realSubjectsList[0].defaultDivision);
  const [selectedRoom, setSelectedRoom] = useState(realSubjectsList[0].defaultRoom);

  // Custom Subject Dropdown open state
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 280);
    return () => clearTimeout(timer);
  }, []);

  // Filter subjects for dropdown search
  const filteredSubjects = realSubjectsList.filter(
    (s) =>
      s.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
      s.type.toLowerCase().includes(subjectSearchQuery.toLowerCase())
  );

  const handleSelectSubject = (subj: typeof realSubjectsList[0]) => {
    setSelectedSubjectObj(subj);
    setSelectedBatch(subj.defaultDivision);
    setSelectedRoom(subj.defaultRoom);
    setIsSubjectDropdownOpen(false);
  };

  const handleGenerateQr = () => {
    startSession(selectedSubjectObj.id, selectedBatch, selectedRoom, selectedSubjectObj.name);
    onNavigateTab('session');
  };

  // Attendance gauge data
  const attendanceRingData = [
    { name: 'Present', value: 88.5, color: '#12A176' },
    { name: 'Absent', value: 11.5, color: '#DCEAE3' }
  ];

  if (isLoading) {
    return <SkeletonDashboardView />;
  }

  return (
    <div className="space-y-6 pb-28 font-['Poppins',sans-serif] text-[#14201B] animate-fadeIn">
      {/* 🌟 HERO COMMAND DECK HEADER (MINT FROST TWO-TONE GRADIENT) */}
      <div className="relative overflow-hidden rounded-3xl hero-gradient-card p-6 md:p-8 text-[#14201B] shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#DCEAE3] text-xs font-bold text-[#12A176]">
              <Sparkles className="w-3.5 h-3.5 text-[#12A176] animate-pulse" />
              <span>Faculty Attendance Portal • Operational Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#14201B] tracking-tight font-['Plus_Jakarta_Sans']">
              Good Day, {user.name} 👋
            </h1>
            <p className="text-xs md:text-sm text-[#5C6B63] font-medium max-w-2xl leading-relaxed">
              Managing student roster across SYBSc IT (Div A, B & C). All attendance records, live verification streams, and subject rosters are operating normally.
            </p>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-white border border-[#DCEAE3] shadow-xs flex flex-col justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5C6B63]">Total Roster</span>
              <span className="text-xl font-black text-[#12A176] mt-0.5">150 Students</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#DCEAE3] shadow-xs flex flex-col justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5C6B63]">Overall Attend %</span>
              <span className="text-xl font-black text-[#12A176] mt-0.5">88.5%</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white border border-[#DCEAE3] shadow-xs flex flex-col justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5C6B63]">Defaulters</span>
              <span className="text-xl font-black text-[#DB5B4E] mt-0.5">12 Flagged</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 TOP 3 COMMAND CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CARD 1: Launch Live Session Terminal (5 Cols) */}
        <div className="lg:col-span-5 p-6 md:p-7 rounded-3xl bg-white text-[#14201B] border border-[#DCEAE3] shadow-xs flex flex-col justify-between relative overflow-visible">
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#12A176] text-white flex items-center justify-center shadow-xs">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#14201B] tracking-tight font-['Plus_Jakarta_Sans']">
                    Launch Live Session
                  </h3>
                  <p className="text-xs text-[#5C6B63] font-medium">Instant HMAC QR & Live Attendance</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#12A176]/12 text-[#12A176] border border-[#12A176]/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12A176] animate-ping" />
                Ready
              </span>
            </div>

            {/* Custom Interactive Subject Selection Field */}
            <div className="space-y-4 my-5">
              <div className="relative">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#5C6B63] mb-1.5 flex items-center justify-between">
                  <span>Select Active Subject</span>
                  <span className="text-[10px] text-[#12A176] font-bold">Real Timetable Roster</span>
                </label>

                {/* Custom Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                  className="w-full bg-[#F8FDFB] hover:bg-[#E5F5EE] border border-[#DCEAE3] rounded-2xl p-3.5 text-left transition-all flex items-center justify-between cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span
                      className="px-2.5 py-1 rounded-xl text-xs font-mono font-black shrink-0 text-white"
                      style={{ backgroundColor: selectedSubjectObj.color }}
                    >
                      {selectedSubjectObj.code}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-black text-[#14201B] truncate group-hover:text-[#12A176] transition-colors">
                        {selectedSubjectObj.name}
                      </div>
                      <div className="text-[10px] text-[#5C6B63] font-bold flex items-center gap-2 mt-0.5">
                        <span>{selectedSubjectObj.type}</span>
                        <span>•</span>
                        <span>{selectedSubjectObj.studentsCount} Students</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#5C6B63] transition-transform duration-300 shrink-0 ${isSubjectDropdownOpen ? 'rotate-180 text-[#12A176]' : ''}`} />
                </button>

                {/* Custom Popover Dropdown Menu */}
                {isSubjectDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-[#DCEAE3] rounded-2xl shadow-xl p-3 space-y-2 animate-fadeIn">
                    {/* Search inside Dropdown */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-[#5C6B63] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search subject by code, title..."
                        value={subjectSearchQuery}
                        onChange={(e) => setSubjectSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl text-xs font-bold text-[#14201B] placeholder-[#5C6B63] focus:outline-none focus:border-[#12A176]"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {filteredSubjects.map((subj) => {
                        const isSelected = subj.id === selectedSubjectObj.id;
                        return (
                          <div
                            key={subj.id}
                            onClick={() => handleSelectSubject(subj)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#E5F5EE] border-[#12A176] text-[#14201B] font-bold'
                                : 'bg-white border-[#DCEAE3] hover:bg-[#F8FDFB] text-[#14201B]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span
                                className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black text-white shrink-0"
                                style={{ backgroundColor: subj.color }}
                              >
                                {subj.code}
                              </span>
                              <div className="truncate">
                                <span className="text-xs font-bold block truncate">{subj.name}</span>
                                <span className="text-[10px] text-[#5C6B63] block">
                                  {subj.defaultDivision} • {subj.studentsCount} Students
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#12A176] shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Class Division & Room Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#5C6B63] mb-1">
                    Class Scope
                  </label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="w-full bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl px-3 py-2.5 text-xs font-bold text-[#14201B] focus:outline-none focus:border-[#12A176] transition-all cursor-pointer"
                  >
                    <option value="SYBSc IT - Div A">SYBSc IT - Div A</option>
                    <option value="SYBSc IT - Div B">SYBSc IT - Div B</option>
                    <option value="SYBSc IT - Div C">SYBSc IT - Div C</option>
                    <option value="SYBSc IT - All Roster">All SYBSc IT Roster</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#5C6B63] mb-1">
                    Assigned Venue
                  </label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full bg-[#F8FDFB] border border-[#DCEAE3] rounded-xl px-3 py-2.5 text-xs font-bold text-[#14201B] focus:outline-none focus:border-[#12A176] transition-all cursor-pointer"
                  >
                    <option value="Room 402">Room 402 (Main Theory)</option>
                    <option value="Lab 1">Lab 1 (Networking)</option>
                    <option value="Lab 2">Lab 2 (OS & Systems)</option>
                    <option value="Lab 3">Lab 3 (Web Tech)</option>
                    <option value="Seminar Hall B">Seminar Hall B</option>
                    <option value="Auditorium 1">Auditorium 1</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateQr}
            className="w-full py-3.5 bg-[#12A176] hover:bg-[#0E8561] text-white font-black rounded-2xl shadow-sm flex items-center justify-center gap-2.5 text-xs tracking-wide transition-all duration-200 transform active:scale-98 cursor-pointer relative z-10"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>START ENCRYPTED LIVE SESSION</span>
          </button>
        </div>

        {/* CARD 2: Today's Class Timetable Radar (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl glass-card border border-[#DCEAE3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-base text-[#14201B] tracking-tight font-['Plus_Jakarta_Sans']">
                  Today's Schedule
                </h3>
                <p className="text-[11px] text-[#5C6B63] font-medium">Faculty Schedule Roster</p>
              </div>

              <button
                onClick={() => onNavigateTab('timetable')}
                className="text-xs font-extrabold text-[#12A176] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Full Timetable
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {mockTimetable.slice(0, 3).map((slot, idx) => {
                const isLive = idx === 0;
                return (
                  <div
                    key={slot.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isLive
                        ? 'bg-[#E5F5EE] border-[#12A176] text-[#14201B] shadow-xs'
                        : 'bg-white border-[#DCEAE3] text-[#14201B]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold font-mono flex items-center gap-1 ${
                          isLive ? 'text-[#12A176]' : 'text-[#5C6B63]'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {slot.time} - {slot.timeEnd}
                      </span>

                      {isLive ? (
                        <span className="bg-[#12A176]/12 text-[#12A176] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#12A176]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#12A176] animate-pulse" />
                          LIVE NOW
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#5C6B63] bg-[#F8FDFB] px-2 py-0.5 rounded-md border border-[#DCEAE3]">
                          {slot.type}
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-xs md:text-sm mt-1.5 leading-tight text-[#14201B]">{slot.subjectName}</h4>

                    <div className="flex items-center justify-between mt-2 text-[11px]">
                      <span className="text-[#5C6B63]">
                        {slot.room} • {slot.className}
                      </span>

                      {isLive && (
                        <button
                          onClick={handleGenerateQr}
                          className="text-[10px] font-black text-[#12A176] hover:underline cursor-pointer"
                        >
                          Launch Now →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('timetable')}
            className="w-full mt-4 py-2.5 bg-white hover:bg-[#E5F5EE] text-[#14201B] font-extrabold text-xs rounded-xl border border-[#DCEAE3] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4 text-[#12A176]" />
            <span>View Full Weekly Timetable</span>
          </button>
        </div>

        {/* CARD 3: 150 Student Roster Attendance Donut & Master Excel Hub (3 Cols) */}
        <div className="lg:col-span-3 p-6 rounded-3xl glass-card border border-[#DCEAE3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-black text-base text-[#14201B] tracking-tight font-['Plus_Jakarta_Sans']">
                  SYBSc IT
                </h3>
                <p className="text-xs text-[#5C6B63] font-medium">150 Students Roster</p>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#12A176] bg-[#12A176]/12 border border-[#12A176]/20 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 text-[#12A176]" />
                88.5%
              </span>
            </div>

            {/* Attendance Donut Ring */}
            <div className="h-36 relative flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceRingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={60}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {attendanceRingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-[#14201B] tracking-tight">
                  88.5%
                </span>
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#5C6B63]">
                  Present Avg
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('attendance_sheet')}
              className="w-full py-2.5 bg-[#12A176] hover:bg-[#0E8561] text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Master Monthly Excel Sheet</span>
            </button>

            <button
              onClick={() => onNavigateTab('attendance_sheet')}
              className="w-full py-2 bg-[#DB5B4E]/10 hover:bg-[#DB5B4E]/20 text-[#DB5B4E] border border-[#DB5B4E]/20 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#DB5B4E]" />
              <span>12 Defaulters (&lt;75%) Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📊 MIDDLE SECTION: LIVE CLASS ACTIVITY & UPCOMING DEADLINES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Stream (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-card border border-[#DCEAE3] shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-black text-lg text-[#14201B] tracking-tight font-['Plus_Jakarta_Sans']">
                Live Class Activity Stream
              </h3>
              <p className="text-xs text-[#5C6B63] font-medium">Real-time attendance logs, assignments, & announcements</p>
            </div>
            <button
              onClick={() => onNavigateTab('gradebook')}
              className="text-xs font-bold text-[#12A176] hover:underline cursor-pointer"
            >
              View All Logs
            </button>
          </div>

          <div className="space-y-3.5">
            {mockRecentActivities.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-white border border-[#DCEAE3] flex items-start justify-between gap-4 transition-all hover:border-[#12A176]"
              >
                <div className="flex items-start gap-3.5">
                  {act.userAvatar ? (
                    <img
                      src={act.userAvatar}
                      alt={act.title}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#12A176]/30 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#12A176]/12 text-[#12A176] flex items-center justify-center font-bold shrink-0">
                      <Megaphone className="w-5 h-5 text-[#12A176]" />
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold text-[#14201B] leading-snug">{act.title}</h4>
                    <span className="text-[11px] font-semibold text-[#5C6B63] mt-1 block">
                      {act.timestamp}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                    act.badgeType === 'success'
                      ? 'bg-[#12A176]/12 text-[#12A176]'
                      : act.badgeType === 'warning'
                      ? 'bg-[#E0A23B]/12 text-[#E0A23B]'
                      : 'bg-[#4E7FD6]/12 text-[#4E7FD6]'
                  }`}
                >
                  {act.badgeText}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines Widget (1 Col) */}
        <div className="p-6 rounded-3xl glass-card border border-[#DCEAE3] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Calendar className="w-5 h-5 text-[#12A176]" />
              <div>
                <h3 className="font-black text-base text-[#14201B] tracking-tight font-['Plus_Jakarta_Sans']">
                  Upcoming Deadlines
                </h3>
                <p className="text-[11px] text-[#5C6B63] font-medium">Pending Assignments & Labs</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {mockAssignments.map((assign) => (
                <div key={assign.id} className="p-3.5 rounded-2xl bg-white border border-[#DCEAE3]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-[#14201B] truncate">{assign.title}</span>
                    <span className="text-[10px] font-bold text-[#DB5B4E] bg-[#DB5B4E]/10 px-2 py-0.5 rounded-full border border-[#DB5B4E]/20 shrink-0">
                      {assign.dueDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C6B63] mt-1">{assign.className}</p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-[#5C6B63]">
                    <span>Graded Submissions</span>
                    <span className="font-extrabold text-[#14201B]">
                      {assign.gradedCount}/{assign.totalSubmissions}
                    </span>
                  </div>
                  <div className="w-full bg-[#E5F5EE] h-2 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#12A176] h-full rounded-full transition-all duration-500"
                      style={{ width: `${(assign.gradedCount / assign.totalSubmissions) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('gradebook')}
            className="w-full mt-4 py-2.5 bg-white hover:bg-[#E5F5EE] text-[#14201B] font-extrabold text-xs rounded-xl border border-[#DCEAE3] transition-all cursor-pointer"
          >
            Manage Gradebook
          </button>
        </div>
      </div>

      {/* ⚡ FLOATING QUICK ACTION BAR */}
      <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white text-[#14201B] px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-full shadow-lg border border-[#DCEAE3] flex items-center gap-2.5 sm:gap-4 max-w-[95vw] overflow-x-auto no-scrollbar">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#12A176] border-r border-[#DCEAE3] pr-2.5 sm:pr-3 shrink-0">
          Quick Actions
        </span>

        <button
          onClick={() => onOpenActionModal('announcement')}
          className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold hover:text-[#12A176] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#12A176]" />
          <span>Post Notice</span>
        </button>

        <span className="w-1 h-1 rounded-full bg-[#DCEAE3] shrink-0" />

        <button
          onClick={() => onOpenActionModal('attendance')}
          className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold hover:text-[#12A176] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#12A176]" />
          <span>Quick Attendance</span>
        </button>

        <span className="w-1 h-1 rounded-full bg-[#DCEAE3] shrink-0" />

        <button
          onClick={() => onOpenActionModal('leave')}
          className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold hover:text-[#E0A23B] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E0A23B]" />
          <span>Substitute / Leave</span>
        </button>
      </div>
    </div>
  );
};

