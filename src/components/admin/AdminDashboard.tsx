import React, { useState } from 'react';
import { SubjectsManager } from './SubjectsManager';
import { ClassesManager } from './ClassesManager';
import { TeacherAssignments } from './TeacherAssignments';
import { ClassRoster } from './ClassRoster';
import { BookOpen, Users, UserPlus, GraduationCap } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeAdminTab, setActiveAdminTab] = useState<'subjects' | 'classes' | 'assignments' | 'roster'>('subjects');

  const tabs = [
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'classes', label: 'Classes', icon: Users },
    { id: 'assignments', label: 'Teacher Assignments', icon: UserPlus },
    { id: 'roster', label: 'Class Roster', icon: GraduationCap },
  ];

  return (
    <div className="space-y-6 pb-24">
      <div className="glass-card p-5 rounded-3xl border border-slate-200/80">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Panel</h2>
        <p className="text-slate-500 text-sm">Manage university structure and assignments</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeAdminTab === tab.id
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        {activeAdminTab === 'subjects' && <SubjectsManager />}
        {activeAdminTab === 'classes' && <ClassesManager />}
        {activeAdminTab === 'assignments' && <TeacherAssignments />}
        {activeAdminTab === 'roster' && <ClassRoster />}
      </div>
    </div>
  );
};
