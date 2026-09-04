import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const ClassRoster: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => { 
    supabase.from('classes').select('id, name, section').then(({ data }) => { if (data) setClasses(data); });
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId) return;
      
      try {
        const { data, error } = await supabase.from('class_enrollments')
          .select('students(name, email)')
          .eq('class_id', selectedClassId);
          
        if (error) throw error;
        if (data) setStudents(data.map((item: any) => item.students)); 
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    };
    fetchStudents();
  }, [selectedClassId]);

  return (
    <div className="space-y-4">
      <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="border p-2 rounded-xl text-xs w-full">
        <option value="">Select Class</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
      </select>
      <table className="w-full text-left border-collapse">
        <thead className="text-[11px] text-slate-500 uppercase">
          <tr><th className="p-3">Name</th><th className="p-3">Email</th></tr>
        </thead>
        <tbody className="divide-y text-xs">
          {students.map((s, i) => (
            <tr key={i}>
              <td className="p-3">{s?.name}</td>
              <td className="p-3">{s?.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
