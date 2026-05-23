'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import {
  ArrowLeft, Loader2, MessageSquare, Send,
  Star, ArrowUpCircle, ListOrdered, Heart, PenTool
} from 'lucide-react';

interface FeedbackResult {
  studentName: string;
  subject: string;
  overallComment: string;
  strengths: string[];
  areasToImprove: string[];
  actionPlan: string[];
  motivationalClose: string;
}

export default function FeedbackGeneratorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    studentName: '',
    subject: '',
    topic: '',
    questionText: '',
    studentAnswer: '',
    marks: 10,
    tone: 'Encouraging' as 'Encouraging' | 'Neutral' | 'Strict',
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
      const res = await api.post('/ai/feedback', {
        studentName: form.studentName || 'Student',
        subject: form.subject,
        topic: form.topic,
        studentAnswer: form.studentAnswer,
        questionText: form.questionText || undefined,
        marks: form.marks,
        tone: form.tone,
      });
      setResult(res.data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate feedback. Please try again.';
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
              <PenTool className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Feedback Generator</h1>
              <p className="text-sm text-gray-500">Generate personalised, constructive feedback for students</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="card p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Student Submission</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Student Name</label>
                  <input className="input" placeholder="e.g. Rahul" value={form.studentName} onChange={(e) => update('studentName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <input className="input" placeholder="e.g. English" required value={form.subject} onChange={(e) => update('subject', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Topic *</label>
                <input className="input" placeholder="e.g. Essay Writing" required value={form.topic} onChange={(e) => update('topic', e.target.value)} />
              </div>

              <div>
                <label className="label">Question <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea className="input min-h-[70px] resize-none" placeholder="The question that was asked..." value={form.questionText} onChange={(e) => update('questionText', e.target.value)} />
              </div>

              <div>
                <label className="label">Student&apos;s Response *</label>
                <textarea className="input min-h-[140px] resize-none" placeholder="Paste or type the student's full response here (min 10 characters)..." required minLength={10} value={form.studentAnswer} onChange={(e) => update('studentAnswer', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Marks Awarded</label>
                  <input type="number" className="input" min={0} max={100} value={form.marks} onChange={(e) => update('marks', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="label">Feedback Tone</label>
                  <select className="input" value={form.tone} onChange={(e) => update('tone', e.target.value)}>
                    <option value="Encouraging">🌟 Encouraging</option>
                    <option value="Neutral">📝 Neutral</option>
                    <option value="Strict">📏 Strict</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
              )}

              <button type="submit" disabled={loading} className="btn-brand w-full py-3 text-base">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</> : <><Send className="h-4 w-4" /> Generate Feedback</>}
              </button>
            </div>
          </form>

          {/* Results */}
          <div className="space-y-5">
            {!result && !loading && (
              <div className="card flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                <div className="bg-gray-50 p-5 rounded-full mb-4">
                  <MessageSquare className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-lg font-bold text-gray-400">Feedback will appear here</p>
                <p className="text-sm text-gray-400 mt-1">Fill in the form and click &quot;Generate Feedback&quot;</p>
              </div>
            )}

            {loading && (
              <div className="card flex flex-col items-center justify-center p-12 min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
                <p className="text-lg font-bold text-gray-600">Crafting feedback...</p>
                <p className="text-sm text-gray-400 mt-1">Making it personal and constructive</p>
              </div>
            )}

            {result && (
              <div className="space-y-5 animate-[fadeIn_0.5s_ease-out]">
                {/* Header */}
                <div className="card p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100">
                  <p className="text-sm text-amber-600 font-bold">Feedback for</p>
                  <p className="text-xl font-black text-gray-900">{result.studentName}</p>
                  <p className="text-sm text-gray-500">{result.subject}</p>
                </div>

                {/* Overall Comment */}
                <div className="card p-6 border-l-4 border-l-amber-400">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Overall Comment</h3>
                      <p className="text-[15px] leading-relaxed text-gray-700">{result.overallComment}</p>
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                {result.strengths?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" /> Strengths
                    </h3>
                    <div className="space-y-2">
                      {result.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                          <Star className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-emerald-800">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Areas to Improve */}
                {result.areasToImprove?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4" /> Areas to Improve
                    </h3>
                    <div className="space-y-2">
                      {result.areasToImprove.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                          <ArrowUpCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-amber-800">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Plan */}
                {result.actionPlan?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <ListOrdered className="h-4 w-4" /> Action Plan
                    </h3>
                    <div className="space-y-2">
                      {result.actionPlan.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">{i + 1}</span>
                          <span className="text-sm text-blue-800">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Motivational Close */}
                {result.motivationalClose && (
                  <div className="card p-6 bg-gradient-to-r from-pink-50 to-rose-50 border-pink-100">
                    <div className="flex items-start gap-3">
                      <Heart className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[15px] leading-relaxed text-gray-700 italic">&ldquo;{result.motivationalClose}&rdquo;</p>
                    </div>
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
