import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Plus, AlertCircle } from 'lucide-react';

const YEARS = ['FYIT', 'SYIT', 'TYIT'];
const SECTIONS = ['A', 'B'];

export const ClassesManager: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [name, setName] = useState(YEARS[0]);
  const [section, setSection] = useState(SECTIONS[0]);
  const [teacherId, setTeacherId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    const { data: cData, error: cError } = await supabase.from('classes').select('*, teachers(name)');
    const { data: tData, error: tError } = await supabase.from('teachers').select('id, name');
    
    if (cError) console.error('Classes fetch error:', cError);
    if (tError) console.error('Teachers fetch error:', tError);

    if (cData) setClasses(cData);
    if (tData) setTeachers(tData);
  };

  const handleAdd = async () => {
    setError('');
    
    // Check for duplicate
    const { data: existing } = await supabase
      .from('classes')
      .select('id')
      .eq('name', name)
      .eq('section', section);

    if (existing && existing.length > 0) {
      setError('This class already exists');
      return;
    }

    const { error: insertError } = await supabase.from('classes').insert({ name, section, teacher_id: teacherId || null });
    if (insertError) {
      setError('Failed to add class');
      return;
    }
    
    setName(YEARS[0]);
    setSection(SECTIONS[0]);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('classes').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <select value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded-xl text-xs">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={section} onChange={e => setSection(e.target.value)} className="border p-2 rounded-xl text-xs">
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="border p-2 rounded-xl text-xs">
            <option value="">Select Teacher</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4"/>Add</button>
        </div>
        {error && <p className="text-rose-600 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
      </div>

      <table className="w-full text-left border-collapse">
        <thead className="text-[11px] text-slate-500 uppercase">
          <tr><th className="p-3">Name</th><th className="p-3">Section</th><th className="p-3">Teacher</th><th className="p-3">Actions</th></tr>
        </thead>
        <tbody className="divide-y text-xs">
          {classes.map(c => (
            <tr key={c.id}>
              <td className="p-3">{c.name}</td>
              <td className="p-3">{c.section}</td>
              <td className="p-3">{c.teachers?.name || 'Unassigned'}</td>
              <td className="p-3">
                <button onClick={() => handleDelete(c.id)} className="text-rose-600 hover:text-rose-800"><Trash2 className="w-4 h-4"/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
