import React, { useState, useRef } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  Check,
  Edit2,
  Trash2,
  Download,
  FileImage,
  FileSpreadsheet,
  GripVertical,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Layers,
  Copy,
  ChevronRight,
  X,
  Tag
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { mockTimetable } from '../../data/mockData';
import { TimetableSlot, LecturePreset } from '../../types';

// Default Saved Lecture Presets for TYIT & IT Dept
const initialSavedLectures: LecturePreset[] = [
  {
    id: 'lec_preset_ai',
    subjectName: 'AI (Artificial Intelligence)',
    code: 'TYIT-601',
    type: 'Lecture',
    defaultRoom: 'Room 402',
    facultyName: 'Dr. Robert Smith',
    colorBg: 'bg-purple-50',
    colorText: 'text-purple-800',
    colorBorder: 'border-purple-200'
  },
  {
    id: 'lec_preset_dmt',
    subjectName: 'DMT (Data Mining Techniques)',
    code: 'TYIT-602',
    type: 'Lecture',
    defaultRoom: 'Room 402',
    facultyName: 'Prof. Anita Desai',
    colorBg: 'bg-indigo-50',
    colorText: 'text-indigo-800',
    colorBorder: 'border-indigo-200'
  },
  {
    id: 'lec_preset_dst',
    subjectName: 'DST (Data Science & Tech)',
    code: 'TYIT-603',
    type: 'Lecture',
    defaultRoom: 'Room 402',
    facultyName: 'Dr. Robert Smith',
    colorBg: 'bg-emerald-50',
    colorText: 'text-emerald-800',
    colorBorder: 'border-emerald-200'
  },
  {
    id: 'lec_preset_da',
    subjectName: 'Data Analytics',
    code: 'TYIT-604',
    type: 'Lecture',
    defaultRoom: 'Room 402',
    facultyName: 'Prof. Anita Desai',
    colorBg: 'bg-amber-50',
    colorText: 'text-amber-800',
    colorBorder: 'border-amber-200'
  },
  {
    id: 'lec_preset_ins',
    subjectName: 'INS / JSAT',
    code: 'TYIT-605',
    type: 'Lecture',
    defaultRoom: 'Room 402',
    facultyName: 'Prof. Anita Desai',
    colorBg: 'bg-sky-50',
    colorText: 'text-sky-800',
    colorBorder: 'border-sky-200'
  },
  {
    id: 'lec_preset_crypto',
    subjectName: 'CRYPTO (Cryptography & NetSec)',
    code: 'TYIT-606',
    type: 'Lecture',
    defaultRoom: 'Room 402',
    facultyName: 'Dr. Robert Smith',
    colorBg: 'bg-rose-50',
    colorText: 'text-rose-800',
    colorBorder: 'border-rose-200'
  },
  {
    id: 'lec_preset_b1_dmt_ai',
    subjectName: 'B1-DMT / B2-AI Lab Batch',
    code: 'TYIT-601P',
    type: 'Practical',
    defaultRoom: 'Lab 1 / Lab 2',
    facultyName: 'Dr. Robert Smith / Prof. Anita Desai',
    colorBg: 'bg-teal-50',
    colorText: 'text-teal-800',
    colorBorder: 'border-teal-200'
  }
];

export const TimetableBuilderView: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>(mockTimetable);
  const [savedLectures, setSavedLectures] = useState<LecturePreset[]>(initialSavedLectures);
  const [activeDayMobile, setActiveDayMobile] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'>('Mon');
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState<TimetableSlot | null>(null);

  // Semester & Target Class Configuration
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester III');
  const [selectedClassGroup, setSelectedClassGroup] = useState<string>('SYBSc IT - Div A');
  
  // Modals and Drawers
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isPresetLibraryOpen, setIsPresetLibraryOpen] = useState(false);
  const [isNewPresetModalOpen, setIsNewPresetModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Drag and Drop state
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  // Slot Form States
  const [formDay, setFormDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'>('Mon');
  const [formSubject, setFormSubject] = useState('');
  const [formRoom, setFormRoom] = useState('Room 402');
  const [formTime, setFormTime] = useState('09:00 AM');
  const [formTimeEnd, setFormTimeEnd] = useState('10:30 AM');
  const [formType, setFormType] = useState<'Lecture' | 'Practical' | 'Tutorial'>('Lecture');
  const [formFaculty, setFormFaculty] = useState('Dr. Robert Smith');

  // New Preset Form States
  const [presetSubjectName, setPresetSubjectName] = useState('');
  const [presetCode, setPresetCode] = useState('');
  const [presetType, setPresetType] = useState<'Lecture' | 'Practical' | 'Tutorial' | 'Seminar'>('Lecture');
  const [presetDefaultRoom, setPresetDefaultRoom] = useState('Room 301');
  const [presetFacultyName, setPresetFacultyName] = useState('Dr. Robert Smith');

  const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Quick select a saved lecture preset into the slot modal form
  const handleSelectPreset = (preset: LecturePreset) => {
    setFormSubject(preset.subjectName);
    setFormRoom(preset.defaultRoom);
    setFormType(preset.type === 'Seminar' ? 'Lecture' : preset.type);
    setFormFaculty(preset.facultyName);
  };

  // Save new preset to saved lecture library
  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetSubjectName.trim()) return;

    const newPreset: LecturePreset = {
      id: 'preset_' + Date.now(),
      subjectName: presetSubjectName,
      code: presetCode || 'IT-MOD',
      type: presetType,
      defaultRoom: presetDefaultRoom,
      facultyName: presetFacultyName,
      colorBg: 'bg-sky-50',
      colorText: 'text-sky-800',
      colorBorder: 'border-sky-200'
    };

    setSavedLectures((prev) => [newPreset, ...prev]);
    setIsNewPresetModalOpen(false);
    setPresetSubjectName('');
    setPresetCode('');
  };

  const handleDeletePreset = (id: string) => {
    setSavedLectures((prev) => prev.filter((p) => p.id !== id));
  };

  const handleOpenAddSlot = (day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri', time?: string) => {
    setSelectedSlotForEdit(null);
    setFormDay(day);
    if (time) setFormTime(time);
    
    // Default to first saved lecture if available
    if (savedLectures.length > 0) {
      handleSelectPreset(savedLectures[0]);
    } else {
      setFormSubject('Data Structures');
      setFormRoom('Room 402');
      setFormType('Lecture');
    }
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlotForEdit) {
      // Edit existing
      setTimetable((prev) =>
        prev.map((s) =>
          s.id === selectedSlotForEdit.id
            ? {
                ...s,
                day: formDay,
                subjectName: formSubject,
                room: formRoom,
                time: formTime,
                timeEnd: formTimeEnd,
                type: formType,
                facultyName: formFaculty
              }
            : s
        )
      );
    } else {
      // Add new
      const newSlot: TimetableSlot = {
        id: 'ts_' + Date.now(),
        day: formDay,
        time: formTime,
        timeEnd: formTimeEnd,
        subjectId: 'subj_custom',
        subjectName: formSubject,
        room: formRoom,
        facultyName: formFaculty,
        type: formType,
        classId: 'class_sybsc_it',
        className: 'SYBSc IT - Div A'
      };
      setTimetable((prev) => [...prev, newSlot]);
    }
    setIsSlotModalOpen(false);
  };

  const handleDeleteSlot = (id: string) => {
    setTimetable((prev) => prev.filter((s) => s.id !== id));
    setIsSlotModalOpen(false);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, slotId: string) => {
    e.dataTransfer.setData('text/plain', slotId);
    setDraggedSlotId(slotId);
  };

  const handleDragOver = (e: React.DragEvent, day: string) => {
    e.preventDefault();
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri') => {
    e.preventDefault();
    setDragOverDay(null);
    const slotId = e.dataTransfer.getData('text/plain') || draggedSlotId;
    if (!slotId) return;

    setTimetable((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, day: targetDay } : s))
    );
    setDraggedSlotId(null);
  };

  // Duplicate schedule from one day to another
  const handleCopyDaySchedule = (fromDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri') => {
    const fromSlots = timetable.filter((s) => s.day === fromDay);
    if (fromSlots.length === 0) return;

    const targetDay = days.find((d) => d !== fromDay && timetable.filter((s) => s.day === d).length === 0) || 'Fri';
    const copiedSlots = fromSlots.map((s) => ({
      ...s,
      id: 'ts_copy_' + Math.random().toString(36).substr(2, 6),
      day: targetDay
    }));

    setTimetable((prev) => [...prev, ...copiedSlots]);
  };

  // Export Timetable as Image (PNG) using html2canvas
  const handleExportImage = async () => {
    if (!gridContainerRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(gridContainerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `CampusOS_Timetable_Spring2026.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export image failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Timetable as iCal / CSV file
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Day,Subject,Room,Time,Type,Instructor,Class\n';
    timetable.forEach((s) => {
      csvContent += `"${s.day}","${s.subjectName}","${s.room}","${s.time} - ${s.timeEnd}","${s.type}","${s.facultyName}","${s.className}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'CampusOS_Weekly_Schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate lecture conflicts (same day + same room or same time)
  const getConflicts = () => {
    const conflictMap = new Set<string>();
    for (let i = 0; i < timetable.length; i++) {
      for (let j = i + 1; j < timetable.length; j++) {
        const a = timetable[i];
        const b = timetable[j];
        if (a.day === b.day && (a.time === b.time || a.room === b.room)) {
          conflictMap.add(a.id);
          conflictMap.add(b.id);
        }
      }
    }
    return conflictMap;
  };

  const conflicts = getConflicts();

  // Statistics
  const totalLectures = timetable.filter((s) => s.type === 'Lecture').length;
  const totalPracticals = timetable.filter((s) => s.type === 'Practical').length;
  const totalHours = timetable.length * 1.5; // ~1.5h per slot

  return (
    <div className="space-y-6 pb-24 font-['Poppins',sans-serif]">
      {/* Top Header Bar & Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-[#E8E3D9] shadow-sm relative overflow-hidden bg-white">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl md:text-2xl font-black text-[#1A1025] tracking-tight font-['Plus_Jakarta_Sans']">
              Semester Timetable Builder
            </h2>
            <span className="text-xs font-black bg-[#A3E635] text-[#1A1025] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#1A1025] animate-pulse" />
              {selectedSemester} • {selectedClassGroup}
            </span>
            {conflicts.size > 0 && (
              <span className="text-xs font-bold bg-[#FB923C]/20 text-[#FB923C] px-3 py-1 rounded-full border border-[#FB923C]/30 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {conflicts.size / 2} Overlap Warning(s)
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B6478] font-medium">
            Define subjects once for the semester. Select subject from list to populate faculty & details automatically.
          </p>

          {/* Semester & Class Config Dropdowns */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <div className="flex items-center gap-2 bg-[#FBF9F4] px-3 py-1.5 rounded-xl border border-[#E8E3D9]">
              <span className="text-[11px] font-extrabold text-[#8B5CF6]">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1A1025] focus:outline-none cursor-pointer"
              >
                <option value="Semester III">Semester III (Odd)</option>
                <option value="Semester IV">Semester IV (Even)</option>
                <option value="Semester V">Semester V (Odd)</option>
                <option value="Semester VI">Semester VI (Even)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#FBF9F4] px-3 py-1.5 rounded-xl border border-[#E8E3D9]">
              <span className="text-[11px] font-extrabold text-[#8B5CF6]">Target Class:</span>
              <select
                value={selectedClassGroup}
                onChange={(e) => setSelectedClassGroup(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1A1025] focus:outline-none cursor-pointer"
              >
                <option value="SYBSc IT - Div A">SYBSc IT - Div A</option>
                <option value="SYBSc IT - Div B">SYBSc IT - Div B</option>
                <option value="TYBSc IT - Div A">TYBSc IT - Div A</option>
                <option value="FYBSc CS - Div A">FYBSc CS - Div A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <button
            onClick={() => setIsNewPresetModalOpen(true)}
            className="px-3.5 py-2.5 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#8B5CF6] border border-[#8B5CF6]/30 font-bold text-xs rounded-2xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Semester Subject</span>
          </button>

          <button
            onClick={() => setIsPresetLibraryOpen(true)}
            className="px-3.5 py-2.5 bg-[#FBF9F4] hover:bg-[#E8E3D9]/50 text-[#1A1025] font-bold text-xs rounded-2xl border border-[#E8E3D9] flex items-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#8B5CF6]" />
            <span>Subjects Library ({savedLectures.length})</span>
          </button>

          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="px-3.5 py-2.5 bg-[#1A1025] hover:bg-[#2A1B3B] text-white font-bold text-xs rounded-2xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <FileImage className="w-4 h-4 text-[#A3E635]" />
            <span>{isExporting ? 'Exporting...' : 'Export Image'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2.5 bg-[#FBF9F4] hover:bg-[#E8E3D9]/50 text-[#1A1025] font-bold text-xs rounded-2xl border border-[#E8E3D9] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#8B5CF6]" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={() => handleOpenAddSlot('Mon')}
            className="px-4 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Slot</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Stats & Saved Lecture Sidebar + Right Weekly Timetable Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT DECORATED SECTION: Workload Stats & Saved Lectures Quick Drawer (4 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Workload Stats Card with Subtle Decorative Patterns & Curved Background Shapes */}
          <div className="glass-card rounded-3xl border border-slate-200/80 p-5 relative overflow-hidden space-y-4">
            {/* Subtle decorative watermark text */}
            <div className="absolute top-2 right-3 text-[10px] font-mono tracking-widest text-slate-400/50 uppercase select-none pointer-events-none">
              TIMETABLE // OS
            </div>
            <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-gradient-to-tr from-sky-300/20 to-teal-300/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>Weekly Workload</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {timetable.length} Slots
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">Lectures</span>
                <span className="text-xl font-black text-sky-900">{totalLectures}</span>
                <span className="text-[10px] text-sky-600 block mt-0.5">{totalLectures * 1.5} hrs/wk</span>
              </div>
              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">Practicals</span>
                <span className="text-xl font-black text-teal-900">{totalPracticals}</span>
                <span className="text-[10px] text-teal-600 block mt-0.5">{totalPracticals * 1.5} hrs/wk</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Total Faculty Commitment</span>
                <span className="font-extrabold text-sky-300">{totalHours} Hours / Week</span>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>

          {/* Quick Saved Lecture Picker Sidebar Box */}
          <div className="glass-card rounded-3xl border border-slate-200/80 p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-600" />
                <span>Saved Lecture Presets</span>
              </h3>
              <button
                onClick={() => setIsNewPresetModalOpen(true)}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Click any saved lecture to instantly create a slot on Monday!
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {savedLectures.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    handleSelectPreset(preset);
                    handleOpenAddSlot('Mon');
                  }}
                  className={`p-2.5 rounded-2xl border ${preset.colorBg} ${preset.colorBorder} hover:shadow-sm transition-all cursor-pointer group flex items-center justify-between`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-white/80 ${preset.colorText}`}>
                        {preset.code}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">{preset.type}</span>
                    </div>
                    <h4 className={`font-black text-xs ${preset.colorText} truncate group-hover:underline`}>
                      {preset.subjectName}
                    </h4>
                    <span className="text-[10px] text-slate-500 block truncate">{preset.defaultRoom}</span>
                  </div>
                  <Plus className={`w-4 h-4 ${preset.colorText} opacity-60 group-hover:opacity-100 shrink-0`} />
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsPresetLibraryOpen(true)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>Manage Lecture Library</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Utility Box */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Copy className="w-4 h-4 text-amber-600" />
              <span>Quick Copy Schedule</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Need Monday's schedule copied to another day? Copy in 1-click.
            </p>
            <button
              onClick={() => handleCopyDaySchedule('Mon')}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] transition-colors cursor-pointer"
            >
              Duplicate Monday to Friday
            </button>
          </div>

        </div>

        {/* RIGHT DECORATED SECTION: Drag & Drop Weekly Timetable Grid (8-9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* DESKTOP 5-COLUMN WEEKLY GRID WITH DRAG & DROP */}
          <div
            id="timetable-grid-container"
            ref={gridContainerRef}
            className="hidden md:block glass-card rounded-3xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden"
          >
            {/* Corner Decorative Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 pattern-dots-subtle opacity-30 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Weekly Schedule Matrix</span>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <GripVertical className="w-3.5 h-3.5 text-slate-400" /> Drag slots between days to rearrange
              </span>
            </div>

            <div className="grid grid-cols-5 gap-4 min-w-[750px]">
              {days.map((day) => {
                const daySlots = timetable.filter((s) => s.day === day);
                const isOver = dragOverDay === day;

                return (
                  <div
                    key={day}
                    onDragOver={(e) => handleDragOver(e, day)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day)}
                    className={`space-y-3 transition-all rounded-2xl p-2 ${
                      isOver ? 'bg-sky-100/60 ring-2 ring-sky-400 ring-dashed' : ''
                    }`}
                  >
                    {/* Day Column Header */}
                    <div className="p-3 bg-slate-900 text-white rounded-2xl text-center shadow-md relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-sky-500/20 rounded-full blur-lg pointer-events-none" />
                      <span className="font-black text-sm tracking-wide block">{day}</span>
                      <span className="text-[10px] text-sky-300 block font-semibold">{daySlots.length} Sessions</span>
                    </div>

                    {/* Day Slots Container */}
                    <div className="space-y-3 min-h-[380px] bg-slate-50/60 p-2.5 rounded-2xl border border-slate-200/60">
                      {daySlots.map((slot) => {
                        const hasConflict = conflicts.has(slot.id);
                        return (
                          <div
                            key={slot.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, slot.id)}
                            onClick={() => {
                              setSelectedSlotForEdit(slot);
                              setFormDay(slot.day as any);
                              setFormSubject(slot.subjectName);
                              setFormRoom(slot.room);
                              setFormTime(slot.time);
                              setFormTimeEnd(slot.timeEnd);
                              setFormType(slot.type);
                              setFormFaculty(slot.facultyName);
                              setIsSlotModalOpen(true);
                            }}
                            className={`p-3.5 rounded-2xl border transition-all cursor-grab active:cursor-grabbing group relative ${
                              hasConflict
                                ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-400 shadow-sm'
                                : 'bg-white border-slate-200/90 shadow-2xs hover:border-sky-400 hover:shadow-md'
                            }`}
                          >
                            {/* Grip Drag Handle Icon */}
                            <div className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 mb-1 pr-4">
                              <span className="flex items-center gap-1 text-slate-700">
                                <Clock className="w-3 h-3 text-sky-600" />
                                {slot.time}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full uppercase text-[9px] font-extrabold ${
                                  slot.type === 'Practical'
                                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                    : slot.type === 'Tutorial'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                                }`}
                              >
                                {slot.type}
                              </span>
                            </div>

                            <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-sky-700 transition-colors leading-tight">
                              {slot.subjectName}
                            </h4>

                            <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-semibold pt-2 border-t border-slate-100">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {slot.room}
                              </span>
                              <span className="text-slate-400 truncate max-w-[80px]">{slot.facultyName}</span>
                            </div>

                            {hasConflict && (
                              <div className="mt-1 text-[9px] text-amber-700 font-bold flex items-center gap-1 bg-amber-100/60 p-1 rounded-lg">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Overlap Warning</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Slot Button inside column */}
                      <button
                        onClick={() => handleOpenAddSlot(day)}
                        className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-sky-400 text-slate-400 hover:text-sky-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-white/40 hover:bg-sky-50/50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Slot</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MOBILE SINGLE-DAY TAB LIST (Visible below 768px - md:hidden) */}
          <div className="md:hidden space-y-4">
            {/* Day Selector Tab Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDayMobile(day)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                    activeDayMobile === day
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {day} ({timetable.filter((s) => s.day === day).length})
                </button>
              ))}
            </div>

            {/* Selected Day Slots List */}
            <div className="space-y-3">
              {timetable
                .filter((s) => s.day === activeDayMobile)
                .map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => {
                      setSelectedSlotForEdit(slot);
                      setFormDay(slot.day as any);
                      setFormSubject(slot.subjectName);
                      setFormRoom(slot.room);
                      setFormTime(slot.time);
                      setFormTimeEnd(slot.timeEnd);
                      setFormType(slot.type);
                      setFormFaculty(slot.facultyName);
                      setIsSlotModalOpen(true);
                    }}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-sky-700">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {slot.time} - {slot.timeEnd}
                      </span>
                      <span className="bg-sky-50 text-sky-800 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold border border-sky-200">
                        {slot.type}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900">{slot.subjectName}</h4>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {slot.room}
                      </span>
                      <span>{slot.facultyName}</span>
                    </div>
                  </div>
                ))}

              <button
                onClick={() => handleOpenAddSlot(activeDayMobile)}
                className="w-full py-3.5 border-2 border-dashed border-sky-200 text-sky-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 bg-sky-50/50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Slot to {activeDayMobile}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ================= MODAL 1: ADD / EDIT TIMETABLE SLOT MODAL ================= */}
      {/* Click outside backdrop automatically closes modal */}
      {isSlotModalOpen && (
        <div
          onClick={() => setIsSlotModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <form
            onSubmit={handleSaveSlot}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 cursor-default animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {selectedSlotForEdit ? 'Edit Slot' : 'Add Timetable Slot'}
                </h3>
                <p className="text-xs text-slate-500">
                  Select a saved lecture or enter custom class details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Saved Lecture Picker Section inside Modal */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-600" />
                <span>Select from Saved Lectures (1-Click Fill)</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                {savedLectures.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                      formSubject === preset.subjectName
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="truncate text-[11px] font-black">{preset.subjectName}</div>
                    <div className="text-[9px] opacity-80 flex items-center justify-between mt-0.5">
                      <span>{preset.code}</span>
                      <span>{preset.defaultRoom}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Day</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Practical">Practical</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structure Practical"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    value={formTimeEnd}
                    onChange={(e) => setFormTimeEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Room / Lab</label>
                  <input
                    type="text"
                    required
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Instructor</label>
                  <input
                    type="text"
                    required
                    value={formFaculty}
                    onChange={(e) => setFormFaculty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {selectedSlotForEdit ? (
                <button
                  type="button"
                  onClick={() => handleDeleteSlot(selectedSlotForEdit.id)}
                  className="px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-100 cursor-pointer"
                >
                  Delete Slot
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Save Timetable Slot
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 2: SAVED LECTURE LIBRARY DRAWER ================= */}
      {/* Click outside backdrop automatically closes drawer */}
      {isPresetLibraryOpen && (
        <div
          onClick={() => setIsPresetLibraryOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 cursor-default animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-600" />
                  <span>Lecture Management Library</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Save your recurring lecture titles once to use anywhere on the timetable grid.
                </p>
              </div>
              <button
                onClick={() => setIsPresetLibraryOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700">
                Saved Presets ({savedLectures.length})
              </span>
              <button
                onClick={() => setIsNewPresetModalOpen(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Saved Lecture</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {savedLectures.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        {preset.code}
                      </span>
                      <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                        {preset.type}
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-slate-900">{preset.subjectName}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Default Room: <span className="font-bold text-slate-800">{preset.defaultRoom}</span> • Faculty: {preset.facultyName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleSelectPreset(preset);
                        setIsPresetLibraryOpen(false);
                        handleOpenAddSlot('Mon');
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      Use in Slot
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsPresetLibraryOpen(false)}
                className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CREATE NEW PRESET MODAL ================= */}
      {/* Click outside backdrop automatically closes modal */}
      {isNewPresetModalOpen && (
        <div
          onClick={() => setIsNewPresetModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <form
            onSubmit={handleCreatePreset}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 cursor-default animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                <span>Save New Lecture Preset</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewPresetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lecture / Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structure Practical"
                  value={presetSubjectName}
                  onChange={(e) => setPresetSubjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS-401P"
                    value={presetCode}
                    onChange={(e) => setPresetCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={presetType}
                    onChange={(e) => setPresetType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Practical">Practical</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Room</label>
                  <input
                    type="text"
                    value={presetDefaultRoom}
                    onChange={(e) => setPresetDefaultRoom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instructor</label>
                  <input
                    type="text"
                    value={presetFacultyName}
                    onChange={(e) => setPresetFacultyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewPresetModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Save Preset
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
