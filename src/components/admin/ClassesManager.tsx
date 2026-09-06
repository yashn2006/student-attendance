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
    const { data: cData } = await supabase.from('classes').select('*, teachers(name)');
    const { data: tData } = await supabase.from('teachers').select('id, name');
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
      {/* ... (form remains) */}
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
