'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import {
  ArrowLeft, Loader2, FileText, CheckCircle, Clock,
  XCircle, Sparkles, BarChart2, PieChart, TrendingUp
} from 'lucide-react';

interface DashboardData {
  total: number;
  completed: number;
  processing: number;
  pending: number;
  failed: number;
  successRate: number;
  bySubject: { subject: string; count: number }[];
  overTime: { date: string; count: number }[];
  avgMarksBySubject: { subject: string; avgMarks: number; count: number }[];
  questionTypeStats: { type: string; count: number }[];
  insights: string[];
}

const BAR_COLORS = [
  '#E5442D', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4',
];

const QT_LABELS: Record<string, string> = {
  MCQ: 'Multiple Choice',
  SHORT: 'Short Answer',
  LONG: 'Long Answer',
  TRUE_FALSE: 'True / False',
};

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { default: api } = await import('../../../lib/api');
        const res = await api.get('/analytics/dashboard');
        setData(res.data.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load analytics.';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rateColor = (rate: number) =>
    rate >= 70 ? '#059669' : rate >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <AppShell>
      <div className="p-5 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/toolkit')} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Toolkit
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <BarChart2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">Track your assessment performance and get AI insights</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
            <p className="text-lg font-bold text-gray-600">Loading analytics...</p>
          </div>
        )}

        {error && (
          <div className="card p-6 text-center">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        )}

        {data && data.total === 0 && (
          <div className="card flex flex-col items-center justify-center p-16 text-center">
            <div className="bg-gray-50 p-5 rounded-full mb-4">
              <BarChart2 className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-xl font-bold text-gray-400">No data yet</p>
            <p className="text-sm text-gray-400 mt-2 max-w-md">
              Create your first assignment to start seeing analytics. Your data will appear here automatically.
            </p>
            <button onClick={() => router.push('/create')} className="btn-brand mt-6 px-8 py-3">
              Create Assignment
            </button>
          </div>
        )}

        {data && data.total > 0 && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Assignments', value: data.total, icon: FileText, gradient: 'from-[#E5442D] to-[#D0301A]' },
                { label: 'Completed', value: data.completed, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600' },
                { label: 'Processing', value: data.processing + data.pending, icon: Clock, gradient: 'from-blue-500 to-blue-600' },
                { label: 'Failed', value: data.failed, icon: XCircle, gradient: 'from-red-500 to-red-600' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="card flex items-center gap-4 p-5">
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                      <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Row 2: Subject Chart + Success Rate */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Subjects Bar Chart */}
              <div className="lg:col-span-2 card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <PieChart className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-[17px] font-bold text-gray-900">Assignments by Subject</h3>
                </div>
                {data.bySubject.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No subject data available</p>
                ) : (
                  <div className="space-y-3">
                    {data.bySubject.map((item, i) => {
                      const maxCount = Math.max(...data.bySubject.map((s) => s.count));
                      const pct = (item.count / maxCount) * 100;
                      return (
                        <div key={item.subject} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600 w-28 truncate">{item.subject}</span>
                          <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden">
                            <div
                              className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                              style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                            >
                              <span className="text-xs font-bold text-white">{item.count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Success Rate Ring */}
              <div className="card p-6 flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Success Rate</h3>
                <div className="relative">
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="56" fill="none" stroke="#F3F4F6" strokeWidth="12" />
                    <circle
                      cx="70" cy="70" r="56" fill="none"
                      stroke={rateColor(data.successRate)}
                      strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={`${(data.successRate / 100) * 352} 352`}
                      transform="rotate(-90 70 70)"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black" style={{ color: rateColor(data.successRate) }}>
                      {data.successRate}%
                    </span>
                    <span className="text-xs text-gray-400">completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Timeline + Question Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Timeline */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <h3 className="text-[17px] font-bold text-gray-900">Assignment Timeline</h3>
                </div>
                {data.overTime.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No timeline data available</p>
                ) : (
                  <div>
                    <div className="flex items-end gap-1 h-40">
                      {data.overTime.map((day, i) => {
                        const maxCount = Math.max(...data.overTime.map((d) => d.count));
                        const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                            <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                              {day.date}: {day.count}
                            </div>
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500 hover:from-blue-600 hover:to-blue-500 min-h-[4px]"
                              style={{ height: `${Math.max(height, 3)}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-gray-400">
                        {data.overTime[0]?.date ? new Date(data.overTime[0].date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {data.overTime[data.overTime.length - 1]?.date ? new Date(data.overTime[data.overTime.length - 1].date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Question Types */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  <h3 className="text-[17px] font-bold text-gray-900">Question Types</h3>
                </div>
                {data.questionTypeStats.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No question type data</p>
                ) : (
                  <div className="space-y-4">
                    {data.questionTypeStats.map((qt, i) => {
                      const totalQT = data.questionTypeStats.reduce((s, q) => s + q.count, 0);
                      const pct = totalQT > 0 ? Math.round((qt.count / totalQT) * 100) : 0;
                      return (
                        <div key={qt.type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{QT_LABELS[qt.type] || qt.type}</span>
                            <span className="text-gray-400">{qt.count} ({pct}%)</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights */}
            {data.insights.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <h3 className="text-[17px] font-bold text-gray-900">AI-Powered Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.insights.map((insight, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                          <Sparkles className="h-4 w-4 text-indigo-600" />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Average Marks by Subject */}
            {data.avgMarksBySubject.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart2 className="h-5 w-5 text-amber-500" />
                  <h3 className="text-[17px] font-bold text-gray-900">Average Marks by Subject</h3>
                </div>
                <div className="space-y-3">
                  {data.avgMarksBySubject.map((item, i) => {
                    const maxMarks = Math.max(...data.avgMarksBySubject.map((s) => s.avgMarks), 100);
                    const pct = (item.avgMarks / maxMarks) * 100;
                    return (
                      <div key={item.subject} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600 w-28 truncate">{item.subject}</span>
                        <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg flex items-center justify-between px-3 transition-all duration-700"
                            style={{ width: `${Math.max(pct, 10)}%`, backgroundColor: BAR_COLORS[(i + 3) % BAR_COLORS.length] }}
                          >
                            <span className="text-xs font-bold text-white">{item.avgMarks} marks</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-20 text-right">{item.count} papers</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
