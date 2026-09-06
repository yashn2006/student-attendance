import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus } from 'lucide-react';

export const TeacherAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: aData } = await supabase.from('class_subject_teachers').select('id, classes(name, section), subjects(name), teachers(name)');
    const { data: cData } = await supabase.from('classes').select('id, name, section');
    const { data: sData } = await supabase.from('subjects').select('id, name');
    const { data: tData } = await supabase.from('teachers').select('id, name');
    if (aData) setAssignments(aData);
    if (cData) setClasses(cData);
    if (sData) setSubjects(sData);
    if (tData) setTeachers(tData);
  };

  const handleAdd = async () => {
    await supabase.from('class_subject_teachers').insert({ class_id: classId, subject_id: subjectId, teacher_id: teacherId });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('class_subject_teachers').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={classId} onChange={e => setClassId(e.target.value)} className="border p-2 rounded-xl text-xs"><option>Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}</select>
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="border p-2 rounded-xl text-xs"><option>Select Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="border p-2 rounded-xl text-xs"><option>Select Teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4"/>Assign</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="text-[11px] text-slate-500 uppercase">
          <tr><th className="p-3">Class</th><th className="p-3">Subject</th><th className="p-3">Teacher</th><th className="p-3">Actions</th></tr>
        </thead>
        <tbody className="divide-y text-xs">
          {assignments.map(a => (
            <tr key={a.id}>
              <td className="p-3">{a.classes?.name} — {a.classes?.section}</td>
              <td className="p-3">{a.subjects?.name}</td>
              <td className="p-3">{a.teachers?.name}</td>
              <td className="p-3"><button onClick={() => handleDelete(a.id)} className="text-rose-600"><Trash2 className="w-4 h-4"/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
