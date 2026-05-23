'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { ArrowLeft, Loader2, Star, Send, Table2 } from 'lucide-react';

interface RubricLevel {
  label: string;
  marks: number;
  description: string;
}

interface RubricCriteria {
  name: string;
  description: string;
  maxMarks: number;
  levels: RubricLevel[];
}

interface RubricResult {
  title: string;
  subject: string;
  topic: string;
  taskType: string;
  totalMarks: number;
  criteria: RubricCriteria[];
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Excellent: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Good:      { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  Average:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  Poor:      { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
};

export default function RubricBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RubricResult | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    subject: '',
    topic: '',
    gradeLevel: 'Class 10',
    taskType: 'Assignment',
    totalMarks: 25,
    criteria: 5,
  });

  const update = (key: string, val: string | number) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { default: api } = await import('../../../lib/api');
      const res = await api.post('/ai/rubric', {
        subject: form.subject,
        topic: form.topic,
        totalMarks: form.totalMarks,
        criteria: form.criteria,
        gradeLevel: form.gradeLevel,
        taskType: form.taskType,
      });
      setResult(res.data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate rubric. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="p-5 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/toolkit')} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Toolkit
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Rubric Builder</h1>
              <p className="text-sm text-gray-500">Generate detailed marking rubrics for fair grading</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Rubric Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="label">Subject *</label>
              <input className="input" placeholder="e.g. Science" required value={form.subject} onChange={(e) => update('subject', e.target.value)} />
            </div>
            <div>
              <label className="label">Topic / Task Description *</label>
              <input className="input" placeholder="e.g. Essay on Climate Change" required value={form.topic} onChange={(e) => update('topic', e.target.value)} />
            </div>
            <div>
              <label className="label">Grade Level</label>
              <select className="input" value={form.gradeLevel} onChange={(e) => update('gradeLevel', e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Task Type</label>
              <select className="input" value={form.taskType} onChange={(e) => update('taskType', e.target.value)}>
                {['Essay', 'Project', 'Practical', 'Presentation', 'Assignment'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Total Marks *</label>
              <input type="number" className="input" min={1} max={200} required value={form.totalMarks} onChange={(e) => update('totalMarks', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="label">Number of Criteria: <span className="text-[#E5442D] font-bold">{form.criteria}</span></label>
              <input type="range" min={2} max={10} className="w-full accent-[#E5442D] mt-2" value={form.criteria} onChange={(e) => update('criteria', parseInt(e.target.value))} />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>2</span><span>10</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-brand mt-6 px-8 py-3">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</> : <><Send className="h-4 w-4" /> Generate Rubric</>}
          </button>
        </form>

        {/* Results */}
        {!result && !loading && (
          <div className="card flex flex-col items-center justify-center p-16 text-center">
            <div className="bg-gray-50 p-5 rounded-full mb-4">
              <Table2 className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-lg font-bold text-gray-400">Your rubric will appear here</p>
            <p className="text-sm text-gray-400 mt-1">Configure the rubric and click &quot;Generate Rubric&quot;</p>
          </div>
        )}

        {loading && (
          <div className="card flex flex-col items-center justify-center p-16">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
            <p className="text-lg font-bold text-gray-600">AI is building your rubric...</p>
            <p className="text-sm text-gray-400 mt-1">Creating detailed criteria and performance levels</p>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            {/* Rubric Header */}
            <div className="card p-6">
              <h2 className="text-xl font-black text-gray-900 mb-2">{result.title}</h2>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">{result.subject}</span>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">{result.taskType}</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">Total: {result.totalMarks} marks</span>
              </div>
            </div>

            {/* Rubric Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-4 font-bold text-gray-700 min-w-[200px]">Criteria</th>
                      <th className="text-center px-4 py-4 font-bold text-emerald-700 min-w-[180px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-xs">🟢 Excellent</span>
                      </th>
                      <th className="text-center px-4 py-4 font-bold text-blue-700 min-w-[180px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-xs">🔵 Good</span>
                      </th>
                      <th className="text-center px-4 py-4 font-bold text-amber-700 min-w-[180px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-xs">🟡 Average</span>
                      </th>
                      <th className="text-center px-4 py-4 font-bold text-red-700 min-w-[180px]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-xs">🔴 Poor</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.criteria.map((c, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-5 py-4 border-b border-gray-100">
                          <p className="font-bold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                          <span className="inline-block mt-1.5 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            Max: {c.maxMarks} marks
                          </span>
                        </td>
                        {c.levels.map((level, li) => {
                          const colors = LEVEL_COLORS[level.label] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                          return (
                            <td key={li} className="px-4 py-4 border-b border-gray-100">
                              <div className={`rounded-xl p-3 ${colors.bg} border ${colors.border}`}>
                                <span className={`text-lg font-black ${colors.text}`}>{level.marks}</span>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{level.description}</p>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
