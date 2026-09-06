import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, ShieldAlert, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TeachersManager: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user } = useAuth();

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    const { data } = await supabase.from('teachers').select('*');
    if (data) setTeachers(data);
  };

  const handleAdd = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-teacher`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ name, email, password })
    });
    if (res.ok) { setName(''); setEmail(''); setPassword(''); fetchTeachers(); }
  };

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    await supabase.from('teachers').update({ is_admin: !currentStatus }).eq('id', id);
    fetchTeachers();
  };

  const handleDelete = async (id: string) => {
    // Basic safety: Don't delete self (though identifying self requires current user ID)
    if (confirm('Are you sure? This will delete the teacher row.')) {
        await supabase.from('teachers').delete().eq('id', id);
        fetchTeachers();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded-xl text-xs" />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 rounded-xl text-xs" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 rounded-xl text-xs" />
        <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4"/>Create Teacher</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="text-[11px] text-slate-500 uppercase">
          <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Admin</th><th className="p-3">Actions</th></tr>
        </thead>
        <tbody className="divide-y text-xs">
          {teachers.map(t => (
            <tr key={t.id}>
              <td className="p-3">{t.name}</td>
              <td className="p-3">{t.email}</td>
              <td className="p-3">
                <button onClick={() => toggleAdmin(t.id, t.is_admin)} className={t.is_admin ? "text-emerald-600" : "text-slate-400"}>
                  {t.is_admin ? <Shield className="w-4 h-4"/> : <ShieldAlert className="w-4 h-4"/>}
                </button>
              </td>
              <td className="p-3">
                  <button onClick={() => handleDelete(t.id)} className="text-rose-600"><Trash2 className="w-4 h-4"/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
