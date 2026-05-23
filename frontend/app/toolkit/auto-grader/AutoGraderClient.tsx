'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, CheckCircle, ArrowUpCircle,
  Award, BarChart3, FileText, Send,
} from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell';

interface GradeResult {
  score: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  detailedBreakdown: string;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#059669', A: '#10B981', 'B+': '#3B82F6', B: '#6366F1',
  C: '#F59E0B', D: '#F97316', F: '#EF4444',
};

export function AutoGraderClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    subject: '',
    gradeLevel: 'Class 10',
    questionText: '',
    correctAnswer: '',
    studentAnswer: '',
    maxMarks: 10,
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
      const res = await api.post('/ai/grade', {
        questionText: form.questionText,
        studentAnswer: form.studentAnswer,
        maxMarks: form.maxMarks,
        subject: form.subject,
        gradeLevel: form.gradeLevel,
        correctAnswer: form.correctAnswer || undefined,
      });
      setResult(res.data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to grade. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result
    ? result.percentage >= 70 ? '#059669' : result.percentage >= 40 ? '#F59E0B' : '#EF4444'
    : '#9CA3AF';

  return (
    <AppShell>
      <div className="p-5 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <button onClick={() => router.push('/toolkit')} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" /> Back to Toolkit
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Auto Grader</h1>
              <p className="text-sm text-gray-500">AI-powered answer evaluation with detailed feedback</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="card space-y-5 p-6">
              <h2 className="text-lg font-bold text-gray-900">Submission Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Subject *</label>
                  <input className="input" placeholder="e.g. Mathematics" required value={form.subject} onChange={(e) => update('subject', e.target.value)} />
                </div>
                <div>
                  <label className="label">Grade Level</label>
                  <select className="input" value={form.gradeLevel} onChange={(e) => update('gradeLevel', e.target.value)}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={`Class ${i + 1}`}>Class {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Question Text *</label>
                <textarea className="input min-h-[100px] resize-none" placeholder="Enter the question that was asked..." required value={form.questionText} onChange={(e) => update('questionText', e.target.value)} />
              </div>

              <div>
                <label className="label">Correct Answer / Key Points <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea className="input min-h-[80px] resize-none" placeholder="Provide the expected answer or key points for better grading..." value={form.correctAnswer} onChange={(e) => update('correctAnswer', e.target.value)} />
              </div>

              <div>
                <label className="label">Student&apos;s Answer *</label>
                <textarea className="input min-h-[120px] resize-none" placeholder="Paste or type the student's answer here..." required value={form.studentAnswer} onChange={(e) => update('studentAnswer', e.target.value)} />
              </div>

              <div className="w-32">
                <label className="label">Max Marks *</label>
                <input type="number" className="input" min={1} max={100} required value={form.maxMarks} onChange={(e) => update('maxMarks', parseInt(e.target.value) || 1)} />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <button type="submit" disabled={loading} className="btn-brand w-full py-3 text-base">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Grading...</> : <><Send className="h-4 w-4" /> Grade Answer</>}
              </button>
            </div>
          </form>

          <div className="space-y-5">
            {!result && !loading && (
              <div className="card flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 rounded-full bg-gray-50 p-5">
                  <Award className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-lg font-bold text-gray-400">Results will appear here</p>
                <p className="mt-1 text-sm text-gray-400">Fill in the form and click &quot;Grade Answer&quot;</p>
              </div>
            )}

            {loading && (
              <div className="card flex min-h-[400px] flex-col items-center justify-center p-12">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-500" />
                <p className="text-lg font-bold text-gray-600">AI is grading...</p>
                <p className="mt-1 text-sm text-gray-400">This usually takes 5-10 seconds</p>
              </div>
            )}

            {result && (
              <div className="space-y-5 animate-[fadeIn_0.5s_ease-out]">
                <div className="card p-6">
                  <div className="flex items-center gap-6">
                    <div className="relative flex-shrink-0">
                      <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                        <circle
                          cx="60" cy="60" r="50" fill="none"
                          stroke={scoreColor} strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${(result.percentage / 100) * 314} 314`}
                          transform="rotate(-90 60 60)"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black" style={{ color: scoreColor }}>{result.score}</span>
                        <span className="text-xs text-gray-400">/ {result.maxMarks}</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="text-3xl font-black text-gray-900">{result.percentage}%</span>
                        <span className="rounded-full px-3 py-1 text-sm font-bold text-white" style={{ backgroundColor: GRADE_COLORS[result.grade] || '#6B7280' }}>
                          {result.grade}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${result.percentage}%`, backgroundColor: scoreColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">Overall Feedback</h3>
                  <p className="text-[15px] leading-relaxed text-gray-700">{result.feedback}</p>
                </div>

                {result.strengths?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-600">
                      <CheckCircle className="h-4 w-4" /> Strengths
                    </h3>
                    <div className="space-y-2">
                      {result.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                          <span className="text-sm text-emerald-800">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.improvements?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-600">
                      <ArrowUpCircle className="h-4 w-4" /> Areas to Improve
                    </h3>
                    <div className="space-y-2">
                      {result.improvements.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3">
                          <ArrowUpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                          <span className="text-sm text-amber-800">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.detailedBreakdown && (
                  <div className="card p-6">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      <BarChart3 className="h-4 w-4" /> Detailed Breakdown
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{result.detailedBreakdown}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
