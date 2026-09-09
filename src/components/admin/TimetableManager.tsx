import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Plus, AlertCircle } from 'lucide-react';

export const TimetableManager: React.FC = () => {
  const [slots, setSlots] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [error, setError] = useState('');

    // Form State
  const [formData, setFormData] = useState({
    day_of_week: 1, 
    period_id: '',
    class_id: '',
    subject_id: '',
    teacher_id: '',
    room: '',
    type: 'lecture' // Changed default to lowercase
  });

  // Filters
  const [filterType, setFilterType] = useState<'class' | 'teacher'>('class');
  const [filterId, setFilterId] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: sData } = await supabase.from('timetable_slots').select('*, classes(*), subjects(*), teachers(*), periods(*)');
    const { data: cData } = await supabase.from('classes').select('id, name, section, class_type');
    const { data: pData } = await supabase.from('periods').select('*').order('start_time');
    const { data: subData } = await supabase.from('subjects').select('id, name');
    const { data: tData } = await supabase.from('teachers').select('id, name');
    
    if (sData) setSlots(sData);
    if (cData) setClasses(cData);
    if (pData) setPeriods(pData);
    if (subData) setSubjects(subData);
    if (tData) setTeachers(tData);
  };

  const handleAdd = async () => {
    setError('');
    
    // Validate required fields
    if (!formData.period_id || !formData.class_id || !formData.subject_id || !formData.teacher_id) {
        setError('Please fill in all required fields.');
        return;
    }

    // Ensure day_of_week is a number
    const submissionData = {
      ...formData,
      day_of_week: Number(formData.day_of_week)
    };
    
    const { error: insertError } = await supabase.from('timetable_slots').insert(submissionData);
    
    if (insertError) {
      if (insertError.message.includes('teacher') && insertError.message.includes('booked')) {
        setError('This teacher already has a class in this period');
      } else if (insertError.message.includes('room') && insertError.message.includes('booked')) {
        setError('This room is already booked in this period');
      } else {
        setError('Failed to book slot: ' + insertError.message);
      }
      return;
    }
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('timetable_slots').delete().eq('id', id);
    fetchData();
  };

  const filteredSlots = slots.filter(s => {
    if (!filterId) return true;
    return filterType === 'class' ? s.class_id === filterId : s.teacher_id === filterId;
  });

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 glass-card p-4 rounded-2xl">
        <select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: Number(e.target.value)})} className="border p-2 rounded-lg text-xs">
          {[
            {label: 'Monday', value: 1},
            {label: 'Tuesday', value: 2},
            {label: 'Wednesday', value: 3},
            {label: 'Thursday', value: 4},
            {label: 'Friday', value: 5},
            {label: 'Saturday', value: 6}
          ].map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select value={formData.period_id} onChange={e => setFormData({...formData, period_id: e.target.value})} className="border p-2 rounded-lg text-xs">
          <option value="" disabled>Select Period</option>
          {periods.filter(p => !p.is_break).map(p => <option key={p.id} value={p.id}>{p.start_time} - {p.end_time}</option>)}
        </select>
        <select value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})} className="border p-2 rounded-lg text-xs">
          <option value="" disabled>Select Class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.class_type})</option>)}
        </select>
        <select value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} className="border p-2 rounded-lg text-xs">
          <option value="" disabled>Select Subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})} className="border p-2 rounded-lg text-xs">
          <option value="" disabled>Select Teacher</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input placeholder="Room" onChange={e => setFormData({...formData, room: e.target.value})} className="border p-2 rounded-lg text-xs"/>
        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="border p-2 rounded-lg text-xs">
          <option value="lecture">Lecture</option>
          <option value="practical">Practical</option>
        </select>
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center"><Plus className="w-4 h-4"/>Book</button>
        {error && <p className="text-rose-600 text-[10px] col-span-full flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto glass-card rounded-2xl">
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="p-2">Period</th>
              {['Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <th key={d} className="p-2">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {periods.map(p => (
              <tr key={p.id} className="border-b">
                <td className="p-2 font-bold">{p.is_break ? 'Break' : `${p.start_time}`}</td>
                {!p.is_break ? (
                  [1, 2, 3, 4, 5, 6].map(d => (
                    <td key={d} className="p-1 align-top">
                      {filteredSlots.filter(s => s.day_of_week === d && s.period_id === p.id).map(s => (
                        <div key={s.id} className="bg-indigo-50 border border-indigo-100 p-1 mb-1 rounded text-[9px]">
                          <div>{s.subjects?.name}</div>
                          <div className="font-bold">{s.classes?.name} - {s.teachers?.name}</div>
                          <button onClick={() => handleDelete(s.id)} className="text-rose-500"><Trash2 className="w-3 h-3"/></button>
                        </div>
                      ))}
                    </td>
                  ))
                ) : <td colSpan={7} className="bg-slate-100 p-2 text-center text-slate-500">Break Period</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
