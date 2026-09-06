import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Subject } from '../../types';
import { Trash2, Edit2, Save, X, Plus } from 'lucide-react';

export const SubjectsManager: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*');
    if (data) setSubjects(data);
  };

  const handleAdd = async () => {
    await supabase.from('subjects').insert({ name, code });
    setName(''); setCode('');
    fetchSubjects();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id);
    fetchSubjects();
  };

  const handleEdit = (s: Subject) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditCode(s.code);
  };

  const saveEdit = async (id: string) => {
    await supabase.from('subjects').update({ name: editName, code: editCode }).eq('id', id);
    setEditingId(null);
    fetchSubjects();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded-xl text-xs" />
        <input placeholder="Code" value={code} onChange={e => setCode(e.target.value)} className="border p-2 rounded-xl text-xs" />
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4"/>Add</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="text-[11px] text-slate-500 uppercase">
          <tr><th className="p-3">Name</th><th className="p-3">Code</th><th className="p-3">Actions</th></tr>
        </thead>
        <tbody className="divide-y text-xs">
          {subjects.map(s => (
            <tr key={s.id}>
              {editingId === s.id ? (
                <>
                  <td className="p-3"><input value={editName} onChange={e => setEditName(e.target.value)} className="border p-1 w-full"/></td>
                  <td className="p-3"><input value={editCode} onChange={e => setEditCode(e.target.value)} className="border p-1 w-full"/></td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => saveEdit(s.id)}><Save className="w-4 h-4 text-emerald-600"/></button>
                    <button onClick={() => setEditingId(null)}><X className="w-4 h-4 text-rose-600"/></button>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.code}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleEdit(s)}><Edit2 className="w-4 h-4 text-indigo-600"/></button>
                    <button onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-rose-600"/></button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
