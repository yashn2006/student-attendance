import React, { useState } from 'react';
import {
  FolderKanban,
  FileText,
  Video,
  Presentation,
  Upload,
  Share2,
  Lock,
  Download,
  Plus,
  Search,
  CheckCircle2
} from 'lucide-react';
import { mockCourseResources } from '../../data/mockData';
import { CourseResource } from '../../types';

export const ResourceLibraryView: React.FC = () => {
  const [resources, setResources] = useState<CourseResource[]>(mockCourseResources);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pdf' | 'video' | 'presentation'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newModule, setNewModule] = useState('Module 1: Introduction');
  const [newType, setNewType] = useState<'pdf' | 'video' | 'presentation'>('pdf');

  const filteredResources = resources.filter((r) => {
    if (activeFilter === 'all') return true;
    return r.type === activeFilter;
  });

  const handleToggleShare = (id: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isShared: !r.isShared } : r))
    );
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRes: CourseResource = {
      id: 'res_' + Date.now(),
      title: newTitle || 'New_Course_Resource.pdf',
      moduleName: newModule,
      subjectId: 'subj_ds',
      type: newType,
      size: '4.2 MB',
      uploadDate: 'Added just now',
      isShared: true
    };
    setResources((prev) => [newRes, ...prev]);
    setShowUploadModal(false);
    setNewTitle('');
  };

  const modules = ['Module 1: Introduction', 'Module 2: Core Concepts', 'Module 3: Advanced Tech'];

  return (
    <div className="space-y-6 pb-24 font-['Poppins',sans-serif]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-3xl border border-slate-200/80">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
              Course Resource Library
            </h2>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
              3 Modules • 44 MB Total
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Module-based course materials, lecture videos, and slides
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer self-end sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['all', 'pdf', 'video', 'presentation'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all capitalize shrink-0 ${
              activeFilter === filter
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {filter === 'all' ? 'All Resources' : filter === 'pdf' ? 'PDFs & Notes' : filter === 'video' ? 'Video Lectures' : 'Slides & PPT'}
          </button>
        ))}
      </div>

      {/* Modules Grouping Grid */}
      <div className="space-y-6">
        {modules.map((modName) => {
          const modResources = filteredResources.filter((r) => r.moduleName === modName);
          return (
            <div key={modName} className="glass-card rounded-3xl p-6 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">
                  {modName}
                </h3>
                <span className="text-xs text-slate-400 font-semibold">{modResources.length} files</span>
              </div>

              {modResources.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-2">No files uploaded under this category yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {modResources.map((res) => (
                    <div
                      key={res.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-indigo-200 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                            {res.type === 'pdf' && <FileText className="w-5 h-5" />}
                            {res.type === 'video' && <Video className="w-5 h-5" />}
                            {res.type === 'presentation' && <Presentation className="w-5 h-5" />}
                          </div>

                          {/* Share Public / Private Toggle */}
                          <button
                            onClick={() => handleToggleShare(res.id)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                              res.isShared
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {res.isShared ? <Share2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            <span>{res.isShared ? 'Shared' : 'Private'}</span>
                          </button>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-900 truncate" title={res.title}>
                          {res.title}
                        </h4>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">
                          {res.size} • {res.uploadDate}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUploadSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Upload Course Material</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Resource Title / Filename</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unit2_Lecture_Notes.pdf"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Target Module</label>
                <select
                  value={newModule}
                  onChange={(e) => setNewModule(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  {modules.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="video">Video Recording</option>
                  <option value="presentation">Presentation / Slides</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
              >
                Upload File
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
