'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import {
  ArrowLeft, Loader2, Zap, Send, Check, X,
  ChevronDown, ChevronUp, Clock, Trophy
} from 'lucide-react';

interface QuizQuestion {
  number: number;
  text: string;
  type: string;
  difficulty: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizResult {
  title: string;
  subject: string;
  topic: string;
  gradeLevel: string;
  estimatedMinutes: number;
  questions: QuizQuestion[];
}

const DIFF_BADGE: Record<string, { bg: string; text: string }> = {
  Easy:   { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Medium: { bg: 'bg-amber-50',   text: 'text-amber-700' },
  Hard:   { bg: 'bg-red-50',     text: 'text-red-700' },
};

export default function QuickQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  const [form, setForm] = useState({
    topic: '',
    subject: '',
    gradeLevel: 'Class 10',
    count: 5,
    type: 'MCQ' as 'MCQ' | 'True/False' | 'Mixed',
    difficulty: 'Mixed' as 'Easy' | 'Medium' | 'Hard' | 'Mixed',
  });

  const update = (key: string, val: string | number) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setAnswers({});
    setShowExplanation({});

    try {
      const { default: api } = await import('../../../lib/api');
      const res = await api.post('/ai/quiz', {
        topic: form.topic,
        subject: form.subject,
        gradeLevel: form.gradeLevel,
        count: form.count,
        type: form.type,
        difficulty: form.difficulty,
      });
      setResult(res.data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create quiz. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qNum: number, option: string) => {
    if (answers[qNum]) return; // already answered
    setAnswers((p) => ({ ...p, [qNum]: option }));
  };

  const toggleExplanation = (qNum: number) => {
    setShowExplanation((p) => ({ ...p, [qNum]: !p[qNum] }));
  };

  const totalAnswered = result ? Object.keys(answers).length : 0;
  const totalCorrect = result
    ? result.questions.filter((q) => answers[q.number] === q.correctAnswer).length
    : 0;
  const allAnswered = result ? totalAnswered === result.questions.length : false;

  return (
    <AppShell>
      <div className="p-5 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.push('/toolkit')} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Toolkit
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50">
              <Zap className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Quick Quiz Creator</h1>
              <p className="text-sm text-gray-500">Generate interactive quizzes in under 30 seconds</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Quiz Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="label">Topic *</label>
              <input className="input" placeholder="e.g. Photosynthesis" required value={form.topic} onChange={(e) => update('topic', e.target.value)} />
            </div>
            <div>
              <label className="label">Subject *</label>
              <input className="input" placeholder="e.g. Biology" required value={form.subject} onChange={(e) => update('subject', e.target.value)} />
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
              <label className="label">Questions: <span className="text-[#E5442D] font-bold">{form.count}</span></label>
              <input type="range" min={3} max={10} className="w-full accent-[#E5442D] mt-2" value={form.count} onChange={(e) => update('count', parseInt(e.target.value))} />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>3</span><span>10</span>
              </div>
            </div>
            <div>
              <label className="label">Question Type</label>
              <select className="input" value={form.type} onChange={(e) => update('type', e.target.value)}>
                <option value="MCQ">MCQ</option>
                <option value="True/False">True / False</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-brand mt-6 px-8 py-3">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating...</> : <><Zap className="h-4 w-4" /> Generate Quiz ⚡</>}
          </button>
        </form>

        {/* Results */}
        {!result && !loading && (
          <div className="card flex flex-col items-center justify-center p-16 text-center">
            <div className="bg-gray-50 p-5 rounded-full mb-4">
              <Zap className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-lg font-bold text-gray-400">Your quiz will appear here</p>
            <p className="text-sm text-gray-400 mt-1">Configure and click &quot;Generate Quiz&quot;</p>
          </div>
        )}

        {loading && (
          <div className="card flex flex-col items-center justify-center p-16">
            <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-4" />
            <p className="text-lg font-bold text-gray-600">Creating quiz...</p>
            <p className="text-sm text-gray-400 mt-1">Generating questions with AI ⚡</p>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            {/* Quiz Header */}
            <div className="card p-6">
              <h2 className="text-xl font-black text-gray-900 mb-2">{result.title}</h2>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-bold">{result.subject}</span>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">{result.gradeLevel}</span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                  <Clock className="h-3 w-3" /> {result.estimatedMinutes} min
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                  {result.questions.length} questions
                </span>
              </div>
            </div>

            {/* Questions */}
            {result.questions.map((q) => {
              const answered = answers[q.number] !== undefined;
              const isCorrect = answers[q.number] === q.correctAnswer;
              const diff = DIFF_BADGE[q.difficulty] || DIFF_BADGE.Medium;

              return (
                <div key={q.number} className="card p-6">
                  {/* Question header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
                      {q.number}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${diff.bg} ${diff.text}`}>
                      {q.difficulty}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                      {q.type}
                    </span>
                  </div>

                  {/* Question text */}
                  <p className="text-[15px] font-semibold text-gray-900 mb-4 leading-relaxed">{q.text}</p>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const letter = String.fromCharCode(65 + oi);
                      const isSelected = answers[q.number] === opt;
                      const isCorrectOption = opt === q.correctAnswer;

                      let optClass = 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer';

                      if (answered) {
                        if (isCorrectOption) {
                          optClass = 'border-emerald-300 bg-emerald-50';
                        } else if (isSelected && !isCorrect) {
                          optClass = 'border-red-300 bg-red-50';
                        } else {
                          optClass = 'border-gray-100 bg-gray-50/50 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => selectAnswer(q.number, opt)}
                          disabled={answered}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${optClass}`}
                        >
                          <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            answered && isCorrectOption
                              ? 'bg-emerald-500 text-white'
                              : answered && isSelected && !isCorrect
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-500'
                          }`}>
                            {answered && isCorrectOption ? <Check className="h-4 w-4" /> : answered && isSelected ? <X className="h-4 w-4" /> : letter}
                          </span>
                          <span className="text-sm text-gray-700 flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation toggle */}
                  {answered && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => toggleExplanation(q.number)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {showExplanation[q.number] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showExplanation[q.number] ? 'Hide' : 'Show'} Explanation
                      </button>
                      {showExplanation[q.number] && (
                        <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <p className="text-sm text-blue-800 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Score Summary */}
            {allAnswered && (
              <div className="card p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white">
                    <Trophy className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-wide">Quiz Complete!</p>
                    <p className="text-3xl font-black text-gray-900">
                      {totalCorrect} / {result.questions.length}
                      <span className="text-lg font-bold text-gray-500 ml-2">
                        ({Math.round((totalCorrect / result.questions.length) * 100)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
