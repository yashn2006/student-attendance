import React, { useState, useEffect, useRef } from 'react';
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
import { supabase } from '../../lib/supabase';
import { TimetableSlot, LecturePreset } from '../../types';

// Exact Semester values matching check constraint
const SEMESTERS = [
  'Semester I', 'Semester II', 'Semester III', 
  'Semester IV', 'Semester V', 'Semester VI'
];

export const TimetableBuilderView: React.FC = () => {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Selection Filters
  const [selectedSemester, setSelectedSemester] = useState<string>(SEMESTERS[2]); // Default Sem III
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  // Modals and Drawers
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  // Slot Form States (Reusing TimetableManager logic)
  const [formData, setFormData] = useState({
    id: '', // for edit
    day_of_week: 1,
    period_id: '',
    class_id: '',
    subject_id: '',
    teacher_id: '',
    room: '',
    type: 'lecture',
    semester: selectedSemester
  });

  const days = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 }
  ];
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedSemester && selectedClassId) {
      fetchTimetable();
    }
  }, [selectedSemester, selectedClassId]);

  const fetchMetadata = async () => {
    const { data: pData } = await supabase.from('periods').select('*').order('period_number');
    const { data: cData } = await supabase.from('classes').select('*').order('name');
    const { data: subData } = await supabase.from('subjects').select('*').order('name');
    const { data: tData } = await supabase.from('teachers').select('*').order('name');
    
    if (pData) setPeriods(pData);
    if (cData) {
      setClasses(cData);
      if (cData.length > 0) setSelectedClassId(cData[0].id);
    }
    if (subData) setSubjects(subData);
    if (tData) setTeachers(tData);
  };

  const fetchTimetable = async () => {
    const { data, error: fetchErr } = await supabase
      .from('timetable_slots')
      .select('*, subjects(name, code), teachers(name), classes(name, section), periods(*)')
      .eq('semester', selectedSemester)
      .eq('class_id', selectedClassId);
    
    if (data) setTimetable(data);
    if (fetchErr) console.error('Timetable fetch error:', fetchErr);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.period_id || !formData.class_id || !formData.subject_id || !formData.teacher_id) {
      setError('Please fill in all required fields.');
      return;
    }

    const payload = {
      day_of_week: formData.day_of_week,
      period_id: formData.period_id,
      class_id: formData.class_id,
      subject_id: formData.subject_id,
      teacher_id: formData.teacher_id,
      room: formData.room,
      type: formData.type,
      semester: selectedSemester
    };

    console.log('Attempting to save timetable slot with payload:', payload);

    let result;
    if (formData.id) {
      console.log('Updating existing slot:', formData.id);
      result = await supabase.from('timetable_slots').update(payload).eq('id', formData.id);
    } else {
      console.log('Inserting new slot');
      result = await supabase.from('timetable_slots').insert([payload]); // Wrapped in array
    }

    if (result.error) {
      console.error('Supabase save error:', result.error);
      if (result.error.message.includes('teacher') || result.error.code === '23505') {
        setError('Schedule Conflict: Teacher or Room already booked for this period.');
      } else {
        setError('Failed to save: ' + (result.error.message || JSON.stringify(result.error)));
      }
      return;
    }

    console.log('Save successful');
    setIsSlotModalOpen(false);
    fetchTimetable();
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Delete this slot?')) return;
    await supabase.from('timetable_slots').delete().eq('id', id);
    fetchTimetable();
  };

  const handleOpenAddSlot = (dayVal: number, periodId?: string) => {
    setFormData({
      id: '',
      day_of_week: dayVal,
      period_id: periodId || '',
      class_id: selectedClassId,
      subject_id: '',
      teacher_id: '',
      room: '',
      type: 'lecture',
      semester: selectedSemester
    });
    setError('');
    setIsSlotModalOpen(true);
  };

  const handleEditSlot = (slot: any) => {
    setFormData({
      id: slot.id,
      day_of_week: slot.day_of_week,
      period_id: slot.period_id,
      class_id: slot.class_id,
      subject_id: slot.subject_id,
      teacher_id: slot.teacher_id,
      room: slot.room,
      type: slot.type,
      semester: slot.semester
    });
    setError('');
    setIsSlotModalOpen(true);
  };

  // Drag and Drop
  const handleDrop = async (e: React.DragEvent, targetDay: number, targetPeriodId: string) => {
    e.preventDefault();
    const slotId = e.dataTransfer.getData('slotId');
    if (!slotId) return;

    const { error: updateErr } = await supabase
      .from('timetable_slots')
      .update({ day_of_week: targetDay, period_id: targetPeriodId })
      .eq('id', slotId);

    if (updateErr) {
      alert('Conflict: Target slot is already occupied for this teacher/room.');
    } else {
      fetchTimetable();
    }
  };

  // Stats Calculation
  const totalLectures = timetable.filter(s => s.type === 'lecture').length;
  const totalPracticals = timetable.filter(s => s.type === 'practical').length;
  
  const calculateTotalHours = () => {
    let totalMinutes = 0;
    timetable.forEach(s => {
      if (s.periods) {
        const start = s.periods.start_time;
        const end = s.periods.end_time;
        // Simple duration parser assuming HH:MM
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        totalMinutes += (h2 * 60 + m2) - (h1 * 60 + m1);
      }
    });
    return (totalMinutes / 60).toFixed(1);
  };

  const totalHours = calculateTotalHours();

  return (
    <div className="space-y-6 pb-24 font-['Poppins',sans-serif]">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-[#E8E3D9] shadow-sm relative overflow-hidden bg-white">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl md:text-2xl font-black text-[#1A1025] tracking-tight font-['Plus_Jakarta_Sans']">
              Semester Timetable Builder
            </h2>
            <span className="text-xs font-black bg-[#A3E635] text-[#1A1025] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#1A1025] animate-pulse" />
              {selectedSemester} • {classes.find(c => c.id === selectedClassId)?.name || 'Class'}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <div className="flex items-center gap-2 bg-[#FBF9F4] px-3 py-1.5 rounded-xl border border-[#E8E3D9]">
              <span className="text-[11px] font-extrabold text-[#8B5CF6]">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1A1025] focus:outline-none cursor-pointer"
              >
                {SEMESTERS.map(sem => <option key={sem} value={sem}>{sem}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#FBF9F4] px-3 py-1.5 rounded-xl border border-[#E8E3D9]">
              <span className="text-[11px] font-extrabold text-[#8B5CF6]">Target Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1A1025] focus:outline-none cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.section} ({c.class_type})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <button
            onClick={() => handleOpenAddSlot(1)}
            className="px-4 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Slot</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stats Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card rounded-3xl border border-slate-200/80 p-5 relative overflow-hidden space-y-4">
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
              </div>
              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">Practicals</span>
                <span className="text-xl font-black text-teal-900">{totalPracticals}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Total Load</span>
                <span className="font-extrabold text-sky-300">{totalHours} Hours / Week</span>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="lg:col-span-9">
          <div className="glass-card rounded-3xl border border-slate-200/80 p-6 shadow-sm relative overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">Period</th>
                  {days.map(d => (
                    <th key={d.value} className="p-2 text-center text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map(p => (
                  <tr key={p.id} className={p.is_break ? 'bg-slate-50/50' : ''}>
                    <td className="p-3 border-b border-slate-50 min-w-[120px]">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900">{p.label}</span>
                        <span className="text-[9px] font-bold text-slate-500">{p.start_time} - {p.end_time}</span>
                        {p.is_break && <span className="text-[8px] font-black text-amber-600 uppercase mt-1">Break</span>}
                      </div>
                    </td>
                    {days.map(d => {
                      const daySlots = timetable.filter(s => s.day_of_week === d.value && s.period_id === p.id);
                      return (
                        <td 
                          key={d.value} 
                          className={`p-2 border-b border-slate-50 align-top min-w-[140px] ${p.is_break ? '' : 'hover:bg-sky-50/30 transition-colors'}`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => !p.is_break && handleDrop(e, d.value, p.id)}
                        >
                          {!p.is_break && daySlots.map(slot => (
                            <div 
                              key={slot.id}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('slotId', slot.id)}
                              onClick={() => handleEditSlot(slot)}
                              className={`mb-2 p-2.5 rounded-2xl border cursor-pointer group relative transition-all ${
                                slot.type === 'practical' 
                                  ? 'bg-teal-50 border-teal-100 text-teal-900' 
                                  : 'bg-white border-slate-100 shadow-2xs hover:border-sky-300'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white/80 border border-current opacity-70">
                                  {slot.subjects?.code}
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <h4 className="text-[10px] font-black leading-tight mb-1">{slot.subjects?.name}</h4>
                              <div className="flex items-center gap-1 text-[9px] font-bold opacity-70 mb-1">
                                <User className="w-2.5 h-2.5" /> {slot.teachers?.name}
                              </div>
                              <div className="flex items-center gap-1 text-[9px] font-bold opacity-70">
                                <MapPin className="w-2.5 h-2.5" /> {slot.room}
                              </div>
                            </div>
                          ))}
                          {!p.is_break && (
                            <button 
                              onClick={() => handleOpenAddSlot(d.value, p.id)}
                              className="w-full py-2 border border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-sky-600 hover:border-sky-200 flex items-center justify-center transition-all opacity-0 hover:opacity-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveSlot}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-black text-lg">{formData.id ? 'Edit' : 'Create'} Timetable Slot</h3>
              <button type="button" onClick={() => setIsSlotModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-bold mb-1">Class</label>
                <select disabled value={formData.class_id} className="w-full p-2 border rounded-xl bg-slate-50">
                   {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Day</label>
                <select 
                  value={formData.day_of_week} 
                  onChange={e => setFormData({...formData, day_of_week: Number(e.target.value)})}
                  className="w-full p-2 border rounded-xl"
                >
                  {days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Period</label>
                <select 
                  value={formData.period_id}
                  onChange={e => setFormData({...formData, period_id: e.target.value})}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="" disabled>Select Period</option>
                  {periods.filter(p => !p.is_break).map(p => <option key={p.id} value={p.id}>{p.start_time} - {p.end_time}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-bold mb-1">Subject</label>
                <select 
                  required
                  value={formData.subject_id}
                  onChange={e => setFormData({...formData, subject_id: e.target.value})}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-bold mb-1">Teacher</label>
                <select 
                  required
                  value={formData.teacher_id}
                  onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="" disabled>Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Room</label>
                <input 
                  value={formData.room}
                  onChange={e => setFormData({...formData, room: e.target.value})}
                  placeholder="e.g. Lab 402"
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="lecture">Lecture</option>
                  <option value="practical">Practical</option>
                </select>
              </div>
            </div>

            {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-rose-100">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>}

            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setIsSlotModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#8B5CF6] text-white rounded-xl text-xs font-black shadow-lg">Save Slot</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
