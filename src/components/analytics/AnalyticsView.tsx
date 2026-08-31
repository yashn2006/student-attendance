import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  BrainCircuit,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { mockTopicMastery } from '../../data/mockData';
import { SkeletonDashboardView } from '../common/Skeleton';

export const AnalyticsView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledRevisionToast, setScheduledRevisionToast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const performanceTrendData = [
    { month: 'Aug', attendance: 82, avgScore: 68 },
    { month: 'Sep', attendance: 86, avgScore: 74 },
    { month: 'Oct', attendance: 88, avgScore: 78 },
    { month: 'Nov', attendance: 91, avgScore: 82 }
  ];

  const gradeDistributionData = [
    { grade: 'A+', count: 14 },
    { grade: 'A', count: 22 },
    { grade: 'B', count: 16 },
    { grade: 'C', count: 8 },
    { grade: 'F', count: 4 }
  ];

  const handleScheduleRevision = () => {
    setScheduledRevisionToast(true);
    setTimeout(() => setScheduledRevisionToast(false), 4000);
  };

  if (isLoading) {
    return <SkeletonDashboardView />;
  }

  return (
    <div className="space-y-6 pb-24 font-sans text-[#14201B]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCEAE3] shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-[#14201B] tracking-tight">
              AI Student Analytics & Health
            </h2>
            <span className="text-xs font-bold bg-[#E5F5EE] text-[#12A176] px-3 py-1 rounded-full flex items-center gap-1 border border-[#DCEAE3]">
              <BrainCircuit className="w-3.5 h-3.5 text-[#12A176]" />
              Real-time Insights
            </span>
          </div>
          <p className="text-xs text-[#5C6B63] font-medium mt-0.5">
            Predictive performance modeling, topic mastery heatmaps & risk care
          </p>
        </div>

        <button
          onClick={handleScheduleRevision}
          className="px-4 py-2.5 bg-[#14201B] hover:bg-[#1f3029] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer self-end sm:self-auto border border-[#DCEAE3]"
        >
          <Calendar className="w-4 h-4 text-[#12A176]" />
          <span>Schedule Revision Session</span>
        </button>
      </div>

      {scheduledRevisionToast && (
        <div className="p-4 bg-[#12A176] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Revision session on 'Concurrency Control' scheduled for Thursday at 02:00 PM in Lab 4! Calendar invites dispatched.</span>
          </div>
        </div>
      )}

      {/* Top 3 Class Health Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-[#DCEAE3] shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B63] block">Class Avg Attendance</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-[#14201B]">88.2%</span>
            <span className="text-xs font-bold text-[#12A176] bg-[#E5F5EE] px-2.5 py-0.5 rounded-full border border-[#DCEAE3]">+3.1% YoY</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DCEAE3] shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B63] block">Predicted Pass Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-[#14201B]">94.5%</span>
            <span className="text-xs font-bold text-[#4E7FD6] bg-[#F8FDFB] px-2.5 py-0.5 rounded-full border border-[#DCEAE3]">High Confidence</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DCEAE3] shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B63] block">Proxy / Discrepancy Risk</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-[#E0A23B]">3 Flagged</span>
            <span className="text-xs font-bold text-[#E0A23B] bg-[#E0A23B]/10 px-2.5 py-0.5 rounded-full border border-[#E0A23B]/30">AI Mismatch</span>
          </div>
        </div>
      </div>

      {/* AI Proxy & Academic Mismatch Detection Card */}
      <div className="p-6 rounded-2xl bg-[#14201B] text-white border border-[#DCEAE3] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F5EE] text-[#12A176] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Zap className="w-3 h-3 text-[#12A176]" /> AI Backstop Engine
            </div>
            <h3 className="text-lg font-bold text-white">
              Attendance vs. Academic Performance Mismatch Flags
            </h3>
            <p className="text-xs text-white/70 font-medium">
              Detecting potential proxy attendance (e.g. phone lending) where logged attendance is high (&ge;85%), but assignment submissions or test scores are severely declining (&lt;50%).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {[
            { name: 'Sanskruti Adak', rollNo: 'T.24.04', attendance: 88, gradeTrend: '38%', risk: 'High Proxy Suspect', reason: 'Attends all live lectures, 0/4 lab assignments submitted' },
            { name: 'Mohd Sameer Shaikh', rollNo: 'ST.25.148', attendance: 92, gradeTrend: '42%', risk: 'Medium Discrepancy', reason: 'High QR scan rate, Quiz 1 score 8/20' },
            { name: 'Siddhesh Parab', rollNo: 'T.24.18', attendance: 85, gradeTrend: '45%', risk: 'Low Discrepancy', reason: 'In-person attendance logged, missing midterm paper' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#12A176] transition-all space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{item.name}</h4>
                  <span className="text-[10px] font-mono text-[#E5F5EE]">{item.rollNo}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DB5B4E]/20 text-rose-300 border border-[#DB5B4E]/40">
                  {item.risk}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-white/5 p-2 rounded-xl text-center">
                  <span className="text-[9px] uppercase text-white/50 block font-bold">Attendance</span>
                  <span className="font-bold text-[#E5F5EE]">{item.attendance}%</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl text-center">
                  <span className="text-[9px] uppercase text-white/50 block font-bold">Submission Trend</span>
                  <span className="font-bold text-rose-300">{item.gradeTrend}</span>
                </div>
              </div>

              <p className="text-[10px] text-white/70 italic leading-snug">{item.reason}</p>

              <button className="w-full py-1.5 rounded-xl bg-[#12A176]/20 hover:bg-[#12A176]/30 text-white font-bold text-[11px] border border-[#12A176]/40 transition-colors cursor-pointer">
                Flag for Academic Review
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section: Performance Trend + Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#DCEAE3] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-[#14201B]">
              Attendance vs. Score Progress
            </h3>
            <span className="text-xs text-[#5C6B63] font-medium">Semester IV</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCEAE3" />
                <XAxis dataKey="month" stroke="#5C6B63" fontSize={11} />
                <YAxis stroke="#5C6B63" fontSize={11} domain={[50, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#4E7FD6" strokeWidth={3} name="Attendance %" />
                <Line type="monotone" dataKey="avgScore" stroke="#12A176" strokeWidth={3} name="Avg Score %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#DCEAE3] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-[#14201B]">
              Grade Distribution
            </h3>
            <span className="text-xs text-[#5C6B63] font-medium">60 Students</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCEAE3" />
                <XAxis dataKey="grade" stroke="#5C6B63" fontSize={11} />
                <YAxis stroke="#5C6B63" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#14201B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Topic Mastery Heatmap Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#DCEAE3] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-[#14201B]">
              Topic Mastery Heatmap
            </h3>
            <p className="text-xs text-[#5C6B63]">Cross-evaluating Quiz 1, Assignment 1, and Midterm scores</p>
          </div>
        </div>

        <div className="p-4 bg-[#DB5B4E]/10 border border-[#DB5B4E]/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#14201B]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#DB5B4E]/20 text-[#DB5B4E]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#DB5B4E]">
                Attention Required: Concurrency Control (35% Mastery)
              </h4>
              <p className="text-xs font-medium text-[#5C6B63] mt-0.5">
                Over 65% of students scored poorly on transaction isolation level questions.
              </p>
            </div>
          </div>

          <button
            onClick={handleScheduleRevision}
            className="px-4 py-2 bg-[#DB5B4E] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            Schedule Remedial Class
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#F8FDFB] border-b border-[#DCEAE3] text-[11px] font-bold text-[#5C6B63] uppercase tracking-wider">
                <th className="py-3 px-4">Topic Name</th>
                <th className="py-3 px-4 text-center">Quiz 1</th>
                <th className="py-3 px-4 text-center">Assign 1</th>
                <th className="py-3 px-4 text-center">Midterm</th>
                <th className="py-3 px-4 text-center">Overall Mastery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCEAE3] text-xs font-bold text-[#14201B]">
              {mockTopicMastery.map((topic) => (
                <tr key={topic.topicName} className="hover:bg-[#F8FDFB]">
                  <td className="py-3.5 px-4">{topic.topicName}</td>
                  <td className="py-3.5 px-4 text-center">{topic.quiz1Score}%</td>
                  <td className="py-3.5 px-4 text-center">{topic.assign1Score}%</td>
                  <td className="py-3.5 px-4 text-center">{topic.midTermScore}%</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${
                        topic.overall < 50
                          ? 'bg-[#DB5B4E]/10 text-[#DB5B4E] border border-[#DB5B4E]/30'
                          : topic.overall < 75
                          ? 'bg-[#E0A23B]/10 text-[#E0A23B] border border-[#E0A23B]/30'
                          : 'bg-[#E5F5EE] text-[#12A176] border border-[#DCEAE3]'
                      }`}
                    >
                      {topic.overall}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
