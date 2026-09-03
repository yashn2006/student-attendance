import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Plus } from 'lucide-react';

export const ClassesManager: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [teacherId, setTeacherId] = useState('');

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    const { data: cData } = await supabase.from('classes').select('*, teachers(name)');
    const { data: tData } = await supabase.from('teachers').select('id, name');
    if (cData) setClasses(cData);
    if (tData) setTeachers(tData);
  };

  const handleAdd = async () => {
    await supabase.from('classes').insert({ name, section, teacher_id: teacherId });
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded-xl text-xs" />
        <input placeholder="Section" value={section} onChange={e => setSection(e.target.value)} className="border p-2 rounded-xl text-xs" />
        <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="border p-2 rounded-xl text-xs">
          <option value="">Select Teacher</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4"/>Add</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="text-[11px] text-slate-500 uppercase">
          <tr><th className="p-3">Name</th><th className="p-3">Section</th><th className="p-3">Teacher</th></tr>
        </thead>
        <tbody className="divide-y text-xs">
          {classes.map(c => (
            <tr key={c.id}>
              <td className="p-3">{c.name}</td>
              <td className="p-3">{c.section}</td>
              <td className="p-3">{c.teachers?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
