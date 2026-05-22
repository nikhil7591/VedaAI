'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UploadCloud, Plus, Minus, X,
  ChevronLeft, ChevronRight, Loader2,
  Calendar, ChevronDown,
} from 'lucide-react';
import { useGenerationStore } from '../../stores/generationStore';
import { AssignmentAPI } from '../../lib/api';
import { cn } from '../../lib/utils';

/* ─── Types ─────────────────────────────────────────────────────── */

type QRow = { id: string; type: string; questions: number; marks: number };

const Q_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'True / False',
  'Diagram / Graph-Based Questions',
  'Numerical Problems',
];

const uid = () => Math.random().toString(36).slice(2, 9);

/* ─── Step progress bar ─────────────────────────────────────────── */

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8 flex items-center gap-2 px-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-all duration-300',
            i <= step ? 'bg-gray-700' : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  );
}

/* ─── +/− Stepper ────────────────────────────────────────────────── */

function Stepper({
  value, onChange, min = 1, max = 100,
}: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="inline-flex items-center gap-4 rounded-full border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-gray-900"
      >
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <span className="w-6 text-center text-[13px] font-bold text-gray-800">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-gray-900"
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}

/* ─── Type selector dropdown ─────────────────────────────────────── */

function TypeSelect({
  value, onChange, used,
}: {
  value: string; onChange: (v: string) => void; used: string[];
}) {
  return (
    <div className="relative flex-1 w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-full bg-transparent font-bold text-[13px] text-gray-800 focus:outline-none transition-colors"
      >
        {Q_TYPES.map((t) => (
          <option key={t} value={t} disabled={used.includes(t) && t !== value} className="font-medium text-gray-800">
            {t}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-800" strokeWidth={2.5} />
    </div>
  );
}

/* ─── Main form ──────────────────────────────────────────────────── */

export function AssignmentForm() {
  const router              = useRouter();
  const searchParams        = useSearchParams();
  const groupId             = searchParams.get('groupId');
  const { setIds, setStatus } = useGenerationStore();

  const [step,       setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const [fileName,   setFileName]   = useState<string | null>(null);

  /* Form state */
  const [title,          setTitle]          = useState('');
  const [subject,        setSubject]        = useState('');
  const [dueDate,        setDueDate]        = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [rows, setRows] = useState<QRow[]>([
    { id: uid(), type: 'Multiple Choice Questions', questions: 4, marks: 4 },
    { id: uid(), type: 'Short Questions',           questions: 4, marks: 4 },
  ]);

  const totalQ  = rows.reduce((s, r) => s + r.questions, 0);
  const totalM  = rows.reduce((s, r) => s + r.questions * r.marks, 0);
  const used    = rows.map((r) => r.type);

  const changeRow = useCallback(
    (id: string, field: keyof QRow, val: string | number) =>
      setRows((p) => p.map((r) => (r.id === id ? { ...r, [field]: val } : r))),
    []
  );
  const addRow = () => {
    const avail = Q_TYPES.find((t) => !used.includes(t));
    if (avail) setRows((p) => [...p, { id: uid(), type: avail, questions: 4, marks: 4 }]);
  };
  const removeRow = (id: string) => setRows((p) => p.filter((r) => r.id !== id));

  const handleFile = (f: File) => setFileName(f.name);

  const validate = () => {
    if (!title.trim())   { alert('Please enter a title.'); return false; }
    if (!subject.trim()) { alert('Please enter a subject.'); return false; }
    if (!dueDate)        { alert('Please select a due date.'); return false; }
    if (!rows.length)    { alert('Add at least one question type.'); return false; }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const qTypes = [...new Set(rows.map((r) => {
        if (r.type.includes('Multiple')) return 'MCQ'       as const;
        if (r.type.includes('Short'))    return 'SHORT'     as const;
        if (r.type.includes('Long'))     return 'LONG'      as const;
        if (r.type.includes('True'))     return 'TRUE_FALSE'as const;
        return 'SHORT' as const;
      }))];

      const payload: any = {
        title:          title.trim(),
        subject:        subject.trim(),
        dueDate:        new Date(dueDate).toISOString(),
        totalMarks:     totalM  || 80,
        totalQuestions: totalQ  || 20,
        questionTypes:  qTypes.length ? qTypes : ['MCQ'],
        difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
        additionalInstructions: additionalInfo.trim(),
      };
      
      if (groupId) {
        payload.groupId = groupId;
      }

      const res = await AssignmentAPI.create(payload);

      setIds(res.assignmentId, res.jobId);
      setStatus('queued', 0);
      router.push(`/assignments/${res.assignmentId}/status`);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to create. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Step 0: Assignment Details ────────────────────────────────── */
  const renderStep0 = () => (
    <div className="rounded-[32px] bg-white p-6 md:p-8 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">Assignment Details</h2>
      <p className="mb-6 mt-1 text-sm text-gray-400">Basic information about your assignment</p>

      {/* Title + Subject — hidden in figma step 0 but needed for backend */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Assignment Title *</label>
          <input className="input" placeholder="e.g. Quiz on Electricity" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Subject *</label>
          <input className="input" placeholder="e.g. Science" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      </div>

      {/* File upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => document.getElementById('file-up')?.click()}
        className={cn(
          'mb-2 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed py-10 transition-colors',
          dragOver ? 'border-[#E5442D] bg-[#FEF3F0]' : 'border-gray-200 bg-[#F9FAFB] hover:border-gray-300'
        )}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
          <UploadCloud className="h-6 w-6 text-gray-700" />
        </div>
        <p className="text-[15px] font-bold text-gray-800">
          {fileName || 'Choose a file or drag & drop it here'}
        </p>
        {!fileName && <p className="mt-1.5 text-xs font-medium text-gray-400">JPEG, PNG, upto 10MB</p>}
        <button
          type="button"
          className="mt-4 rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          Browse Files
        </button>
        <input id="file-up" type="file" className="hidden" accept="image/*,.pdf"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      <p className="mb-8 text-center text-[13px] font-medium text-gray-400 leading-relaxed max-w-xs mx-auto">
        Upload images of your preferred document/ image
      </p>

      {/* Due Date */}
      <div className="mb-6">
        <label className="label mb-2 text-[15px] font-bold text-gray-800">Due Date</label>
        <div className="relative">
          <input type="date" className="w-full rounded-full bg-gray-50 py-3.5 pl-5 pr-12 border border-gray-200 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-gray-200" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Calendar className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700" />
        </div>
      </div>

      {/* Question Type */}
      <div className="mb-6">
        <label className="label mb-3 text-[15px] font-bold text-gray-800">Question Type</label>

        {/* ── Desktop table ── */}
        <div className="hidden rounded-2xl border border-gray-100 overflow-hidden md:block">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Question Type</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">No. of Questions</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Marks</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-gray-50">
                  <td className="px-4 py-3">
                    <TypeSelect value={row.type} onChange={(v) => changeRow(row.id, 'type', v)} used={used} />
                  </td>
                  <td className="px-4 py-3">
                    <Stepper value={row.questions} onChange={(v) => changeRow(row.id, 'questions', v)} />
                  </td>
                  <td className="px-4 py-3">
                    <Stepper value={row.marks} onChange={(v) => changeRow(row.id, 'marks', v)} max={50} />
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => removeRow(row.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="space-y-4 md:hidden">
          {rows.map((row) => (
            <div key={row.id} className="rounded-3xl bg-white shadow-sm border border-gray-100 p-4">
              <div className="mb-3 flex items-center justify-between gap-2 pl-2">
                <TypeSelect value={row.type} onChange={(v) => changeRow(row.id, 'type', v)} used={used} />
                <button type="button" onClick={() => removeRow(row.id)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-[#F8F9FA] p-3 rounded-[20px]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-[11px] font-bold text-gray-600">No. of Questions</p>
                  <Stepper value={row.questions} onChange={(v) => changeRow(row.id, 'questions', v)} />
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-[11px] font-bold text-gray-600">Marks</p>
                  <Stepper value={row.marks} onChange={(v) => changeRow(row.id, 'marks', v)} max={50} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add row button */}
        <button
          type="button" onClick={addRow}
          disabled={used.length >= Q_TYPES.length}
          className="mt-4 flex items-center gap-2 text-[13px] font-bold text-gray-800 disabled:opacity-40"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1A1A1A] text-white">
            <Plus className="h-4 w-4" strokeWidth={3} />
          </div>
          Add Question Type
        </button>

        {/* Totals */}
        <div className="mt-5 flex flex-col items-end gap-1 text-[13px] mr-2">
          <div className="text-gray-800">
            Total Questions : <span className="font-bold">{totalQ}</span>
          </div>
          <div className="text-gray-800">
            Total Marks : <span className="font-bold">{totalM}</span>
          </div>
        </div>
      </div>

      {/* Additional info */}
      <div className="mb-6">
        <label className="label">Additional Information (For better output)</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Eg: Generate questions based on Ohm's Law for Class 10 CBSE level..."
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
        />
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button 
          type="button" 
          onClick={() => router.push('/assignments')} 
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3.5 text-sm font-bold text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Previous
        </button>
        <button
          type="button"
          onClick={() => {
            if (!title.trim() || !subject.trim() || !dueDate) {
              alert('Please fill in title, subject, and due date.');
              return;
            }
            setStep(1);
          }}
          className="flex items-center gap-2 rounded-full bg-[#1A1A1A] px-9 py-3.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          Next 
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );

  /* ── Step 1: Review ─────────────────────────────────────────────── */
  const renderStep1 = () => (
    <div className="card p-5 md:p-7">
      <h2 className="text-base font-bold text-gray-900">Review & Generate</h2>
      <p className="mb-5 mt-0.5 text-xs text-gray-400">
        Confirm your paper configuration before generating
      </p>

      <div className="space-y-3">
        {[
          { label: 'Title',           value: title           },
          { label: 'Subject',         value: subject         },
          { label: 'Due Date',        value: dueDate         },
          { label: 'Total Questions', value: String(totalQ)  },
          { label: 'Total Marks',     value: String(totalM)  },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-900">{value || '—'}</span>
          </div>
        ))}

        {/* Question types */}
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Question Types</p>
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-0.5 text-sm">
              <span className="text-gray-700">{r.type}</span>
              <span className="font-semibold text-gray-800">
                {r.questions}Q × {r.marks} mk
              </span>
            </div>
          ))}
        </div>

        {additionalInfo && (
          <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="mb-1 text-xs text-gray-400">Additional Instructions</p>
            {additionalInfo}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
        <button type="button" onClick={() => setStep(0)} className="btn-ghost">
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          type="button" onClick={submit} disabled={submitting}
          className="btn-dark rounded-full px-6 py-2.5"
        >
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            : <>Generate Paper <ChevronRight className="h-4 w-4" /></>
          }
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <StepBar step={step} total={2} />
      {step === 0 ? renderStep0() : renderStep1()}
    </div>
  );
}
