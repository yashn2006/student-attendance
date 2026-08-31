import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  FileText,
  Upload,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code2,
  Copy,
  Check,
  Send,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { AILectureAnalysisResult } from '../../types';

export const LectureAIAnalyzerView: React.FC = () => {
  const [subjectName, setSubjectName] = useState('Data Structures & Algorithms');
  const [topicTitle, setTopicTitle] = useState('Binary Search Trees & Red-Black Tree Rotations');
  const [lectureText, setLectureText] = useState(`
Binary Search Trees (BST) provide logarithmic operational time complexity O(log N) on balanced tree topologies. However, sequential insertions lead to skewed trees degenerating to O(N) linked-list performance.

Red-Black Trees resolve this by introducing red/black node coloring invariants:
1. Every node is either Red or Black.
2. The root node is strictly Black.
3. Every leaf (NIL) node is Black.
4. If a node is Red, both of its children must be Black (no consecutive Red nodes).
5. Every path from a node to any of its descendant NIL nodes contains the same number of Black nodes.

When violating invariant 4 during insertion, tree rotations (Left-Rotate and Right-Rotate) accompanied by color flips restore balance in worst-case O(log N) time with at most 2 rotations.
`);

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AILectureAnalysisResult | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    if (!lectureText.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze-lecture-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureText,
          subjectName,
          topicTitle,
          className: 'SYBSc IT'
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAnalysisResult({
          ...resData.data,
          analyzedAt: new Date().toLocaleTimeString(),
          sourceType: resData.source
        });
      }
    } catch (err) {
      console.error('Failed to run Gemini lecture analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleLoadSample = (sampleType: 'ds' | 'os' | 'db') => {
    if (sampleType === 'ds') {
      setSubjectName('Data Structures');
      setTopicTitle('Binary Search Trees & Red-Black Tree Rotations');
      setLectureText(`Binary Search Trees (BST) provide logarithmic operational time complexity O(log N) on balanced tree topologies...`);
    } else if (sampleType === 'os') {
      setSubjectName('Operating Systems');
      setTopicTitle('Process Synchronization & Deadlock Prevention');
      setLectureText(`Process synchronization ensures concurrent threads execute without race conditions. Critical sections are protected using Dijkstra's counting semaphores and mutex locks. Deadlocks occur when 4 Coffman conditions hold: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Banker's Algorithm prevents deadlock state.`);
    } else {
      setSubjectName('Database Systems');
      setTopicTitle('ACID Properties & Concurrency Control');
      setLectureText(`Database transactions satisfy ACID principles: Atomicity, Consistency, Isolation, and Durability. Strict Two-Phase Locking (2PL) avoids cascading rollbacks by holding write locks until transaction commit or abort.`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Poppins',sans-serif] text-slate-900 pb-24">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl glass-card border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-sky-700 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 font-['Plus_Jakarta_Sans']">
              Gemini AI Lecture PDF & Document Analyzer
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200/80 font-bold">
                Server-Side Gemini 3.6 Flash
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Instantly extract lecture summaries, generate 5 attendance quiz questions, lab tasks, and remediation strategies.
            </p>
          </div>
        </div>

        {/* Preset Sample Selector Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleLoadSample('ds')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 transition-all cursor-pointer"
          >
            Sample: Data Structures
          </button>
          <button
            onClick={() => handleLoadSample('os')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 transition-all cursor-pointer"
          >
            Sample: OS Deadlock
          </button>
          <button
            onClick={() => handleLoadSample('db')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 transition-all cursor-pointer"
          >
            Sample: DBMS ACID
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Form (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl glass-card border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 font-['Plus_Jakarta_Sans']">
            <FileText className="w-4 h-4 text-sky-600" /> Input Lecture Document
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subject Name</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Topic Title</label>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Paste Lecture Text or PDF Transcript
              </label>
              <textarea
                rows={10}
                value={lectureText}
                onChange={(e) => setLectureText(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                placeholder="Paste notes, PDF transcript, or syllabus content here..."
              />
            </div>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-800 to-teal-700 hover:opacity-95 text-white font-extrabold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Running Gemini AI Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-teal-300" />
                <span>Analyze with Gemini 3.6 Flash</span>
              </>
            )}
          </button>
        </div>

        {/* Right Analysis Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!analysisResult ? (
            <div className="p-12 rounded-3xl glass-card border border-slate-200/80 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-3">
                <Cpu className="w-7 h-7 text-sky-600" />
              </div>
              <h4 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans']">Ready for Curriculum AI Analysis</h4>
              <p className="text-xs text-slate-500 font-medium max-w-md mt-1">
                Click "Analyze with Gemini 3.6 Flash" to extract high-yield lecture insights, attendance quiz questions, and lab tasks.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Card 1: Executive Summary */}
              <div className="p-5 rounded-3xl glass-card border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                    <BookOpen className="w-4 h-4 text-sky-600" /> Executive Summary
                  </h4>
                  <button
                    onClick={() => handleCopyText(analysisResult.executiveSummary, 'summary')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSection === 'summary' ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 font-medium">
                  {analysisResult.executiveSummary}
                </p>
              </div>

              {/* Card 2: 5 Smart Quiz Questions */}
              <div className="p-5 rounded-3xl glass-card border border-slate-200/80 shadow-sm">
                <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                  <HelpCircle className="w-4 h-4 text-teal-600" /> 5 Smart Attendance Quiz Questions
                </h4>
                <div className="space-y-3">
                  {analysisResult.quizQuestions?.map((q, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
                      <div className="text-xs font-extrabold text-slate-900 mb-1.5">
                        Q{idx + 1}. {q.question}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 my-2">
                        {q.options?.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className={`px-2.5 py-1 rounded-lg text-[11px] border font-mono ${
                              opt === q.correctAnswer
                                ? 'bg-teal-50 text-teal-900 border-teal-300 font-bold'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-600 italic mt-1 font-medium">
                        ✓ Answer: <strong className="text-teal-700 font-bold">{q.correctAnswer}</strong> — {q.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Learning Outcomes & Lab Tasks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl glass-card border border-slate-200/80 shadow-sm">
                  <h4 className="text-xs font-black text-slate-900 mb-2 uppercase tracking-wider flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" /> Learning Outcomes
                  </h4>
                  <ul className="space-y-1.5">
                    {analysisResult.learningOutcomes?.map((out, i) => (
                      <li key={i} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                        <span className="text-teal-600 font-bold">•</span>
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-3xl glass-card border border-slate-200/80 shadow-sm">
                  <h4 className="text-xs font-black text-slate-900 mb-2 uppercase tracking-wider flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                    <Code2 className="w-4 h-4 text-amber-600" /> Lab Exercises
                  </h4>
                  <div className="space-y-2">
                    {analysisResult.labExercises?.map((ex, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                        <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                          <span>{ex.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                            {ex.difficulty}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium mt-1">{ex.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 4: Misconception Warnings */}
              <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-200 text-amber-950 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider mb-1.5 flex items-center gap-2 text-amber-900 font-['Plus_Jakarta_Sans']">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> Common Student Trap / Misconceptions
                </h4>
                <ul className="space-y-1">
                  {analysisResult.misconceptionWarnings?.map((warn, i) => (
                    <li key={i} className="text-xs text-amber-900 font-semibold leading-normal">
                      ⚠️ {warn}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
