'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UploadCloud, Plus, Minus, X,
  ChevronLeft, ChevronRight, Loader2,
  ChevronDown,
} from 'lucide-react';
import { useGenerationStore } from '../../stores/generationStore';
import { AIAPI, AssignmentAPI } from '../../lib/api';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  const { setIds, setStatus } = useGenerationStore();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [className, setClassName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [rows, setRows] = useState<QRow[]>([
    { id: uid(), type: 'Multiple Choice Questions', questions: 4, marks: 4 },
    { id: uid(), type: 'Short Questions', questions: 4, marks: 4 },
  ]);

  const generatedAssignmentTitle = className.trim() && subjectName.trim()
    ? `${className.trim()} ${subjectName.trim()} Assignment`
    : 'Assignment';
  const assignmentSubject = subjectName.trim() || 'General';

  const totalQ = rows.reduce((s, r) => s + r.questions, 0);
  const totalM = rows.reduce((s, r) => s + r.questions * r.marks, 0);
  const used = rows.map((r) => r.type);

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

  const handleFile = async (f: File) => {
    setFileName(f.name);
    setFile(f);

    if (!f.type.startsWith('image/')) {
      return;
    }

    setExtracting(true);
    try {
      const extracted = await AIAPI.extractTextFromImage(f);
      if (extracted.text) {
        setAdditionalInfo((current) => (current.trim() ? current : extracted.text));
      }
    } catch (error: any) {
      alert(error?.message ?? 'Failed to extract text from the uploaded image.');
    } finally {
      setExtracting(false);
    }
  };

  const validate = () => {
    if (!dueDate) { alert('Please select a due date.'); return false; }
    if (!className.trim()) { alert('Please enter the class.'); return false; }
    if (!subjectName.trim()) { alert('Please enter the subject.'); return false; }
    const selectedDate = new Date(`${dueDate}T23:59:59.999`);
    if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
      alert('Please select a future due date.');
      return false;
    }
    if (!rows.length) { alert('Add at least one question type.'); return false; }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const qTypes = [...new Set(rows.map((r) => {
        if (r.type.includes('Multiple')) return 'MCQ' as const;
        if (r.type.includes('Short')) return 'SHORT' as const;
        if (r.type.includes('Long')) return 'LONG' as const;
        if (r.type.includes('True')) return 'TRUE_FALSE' as const;
        return 'SHORT' as const;
      }))];

      const payload: any = {
        title: generatedAssignmentTitle,
        className: className.trim(),
        subject: assignmentSubject,
        dueDate: new Date(`${dueDate}T23:59:59.999`).toISOString(),
        totalMarks: totalM || 80,
        totalQuestions: totalQ || 20,
        questionTypes: qTypes.length ? qTypes : ['MCQ'],
        questionPlan: rows.map((row) => ({
          type: row.type,
          questions: row.questions,
          marks: row.marks,
        })),
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
    <div className="w-full">
      <div className="mb-5 w-full text-left">
        <div className="flex w-fit items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.14)]" />
          <h1 className="text-[23px] font-bold tracking-tight text-[#101828] md:text-[24px]">Create Assignment</h1>
        </div>
        <div className="w-full max-w-[360px]">
          <p className="mt-2 text-[15px] text-[#98A2B3] md:text-sm">Set up a new assignment for your students</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[750px]">
        <StepBar step={step} total={2} />

        <div className="rounded-[30px] bg-[#ECECEC] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)] md:p-8">
          <h2 className="text-[22px] font-bold tracking-tight text-[#101828] md:text-[24px]">Assignment Details</h2>
          <p className="mt-1.5 text-sm text-[#98A2B3]">Basic information about your assignment</p>

          {/* Class + Subject */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[15px] font-bold text-[#101828]">Class</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. 8th, 9th, 10th"
                className="w-full rounded-full border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-3.5 text-sm font-medium text-[#101828] outline-none placeholder:text-[#98A2B3] focus:border-[#E5442D] focus:ring-2 focus:ring-[#E5442D]/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-[15px] font-bold text-[#101828]">Subject</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Mathematics, English, Science"
                className="w-full rounded-full border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-3.5 text-sm font-medium text-[#101828] outline-none placeholder:text-[#98A2B3] focus:border-[#E5442D] focus:ring-2 focus:ring-[#E5442D]/10"
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-[#344054] ring-1 ring-black/5">
            <span className="font-semibold text-[#101828]">Assignment Name:</span> {generatedAssignmentTitle}
          </div>

          {/* File upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) void handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'mt-6 mb-3 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed bg-white px-4 py-10 text-center transition-colors md:px-6',
              dragOver ? 'border-[#E5442D] bg-[#FEF3F0]' : 'border-[#D6D6D6] hover:border-[#BFC3CC]'
            )}
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#344054] shadow-[0_4px_12px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-[15px] font-semibold text-[#101828]">
              {fileName || 'Choose a file or drag & drop it here'}
            </p>
            {!fileName && <p className="mt-1.5 text-[12px] font-medium text-[#98A2B3]">JPEG, PNG, UPTO 10MB</p>}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="mt-5 rounded-full bg-[#F3F4F6] px-5 py-2.5 text-[13px] font-semibold text-[#344054] transition-colors hover:bg-[#E9EAEE]"
            >
              {extracting ? 'Extracting...' : 'Browse Files'}
            </button>
            <input
              id="file-up"
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
            />
          </div>
          <p className="mb-8 text-center text-[13px] font-medium leading-relaxed text-[#98A2B3] md:mb-7">
            Upload images of your preferred document/ image
          </p>

          {/* Due Date */}
          <div className="mb-6">
            <label className="mb-2 block text-[15px] font-bold text-[#101828]">Due Date</label>
            <div className="relative">
              <input
                type="date"
                className="w-full rounded-full border border-[#D0D5DD] bg-[#F9FAFB] py-3.5 pl-5 pr-5 text-sm font-medium text-[#101828] outline-none placeholder:text-[#98A2B3] focus:border-[#E5442D] focus:ring-2 focus:ring-[#E5442D]/10"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Question Type */}
          <div className="mb-6">
            <label className="mb-3 block text-[15px] font-bold text-[#101828]">Question Type</label>

            {/* ── Desktop UI ── */}
            <div className="hidden md:block">
              <div className="mb-3 flex justify-end gap-10 pr-4">
                <div className="w-[120px] text-center text-[12px] font-bold text-[#344054]">No. of Questions</div>
                <div className="w-[120px] text-center text-[12px] font-bold text-[#344054]">Marks</div>
              </div>
              <div className="space-y-4">
                {rows.map((row) => (
                  <div key={row.id} className="flex items-center gap-3">
                    <div className="flex-1 rounded-full border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                      <TypeSelect value={row.type} onChange={(v) => changeRow(row.id, 'type', v)} used={used} />
                    </div>
                    <button type="button" onClick={() => removeRow(row.id)} className="flex h-8 w-8 items-center justify-center text-[#98A2B3] transition-colors hover:text-[#101828]">
                      <X className="h-4 w-4" />
                    </button>
                    <div className="w-[120px] flex justify-center">
                      <Stepper value={row.questions} onChange={(v) => changeRow(row.id, 'questions', v)} />
                    </div>
                    <div className="w-[120px] flex justify-center">
                      <Stepper value={row.marks} onChange={(v) => changeRow(row.id, 'marks', v)} max={50} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Mobile cards ── */}
            <div className="space-y-4 md:hidden">
              {rows.map((row) => (
                <div key={row.id} className="rounded-[22px] bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
                  <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
                    <TypeSelect value={row.type} onChange={(v) => changeRow(row.id, 'type', v)} used={used} />
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-[#98A2B3] transition-colors hover:text-[#101828]"
                    >
                      <X className="h-5 w-5" strokeWidth={2} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center justify-center gap-2 rounded-[18px] bg-[#F9FAFB] px-3 py-3">
                      <p className="text-[12px] font-bold text-[#344054]">No. of Questions</p>
                      <Stepper value={row.questions} onChange={(v) => changeRow(row.id, 'questions', v)} />
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 rounded-[18px] bg-[#F9FAFB] px-3 py-3">
                      <p className="text-[12px] font-bold text-[#344054]">Marks</p>
                      <Stepper value={row.marks} onChange={(v) => changeRow(row.id, 'marks', v)} max={50} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add row button */}
            <button
              type="button"
              onClick={addRow}
              disabled={used.length >= Q_TYPES.length}
              className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-[#101828] disabled:opacity-40"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#101828] text-white shadow-sm">
                <Plus className="h-4 w-4" strokeWidth={3} />
              </div>
              Add Question Type
            </button>

            {/* Totals */}
            <div className="mt-5 flex flex-col items-end gap-1 text-[13px] text-[#101828]">
              <div>
                Total Questions : <span className="font-bold">{totalQ}</span>
              </div>
              <div>
                Total Marks : <span className="font-bold">{totalM}</span>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="mb-6 relative">
            <label className="mb-3 block text-[15px] font-bold text-[#101828]">Additional Information (For better output)</label>
            <textarea
              className="w-full resize-none rounded-[18px] border border-[#E5E7EB] bg-[#F9FAFB] p-4 pr-10 text-sm font-medium text-[#101828] shadow-[0_2px_8px_rgba(15,23,42,0.04)] outline-none placeholder:text-[#98A2B3] focus:border-[#E5442D] focus:ring-2 focus:ring-[#E5442D]/10"
              rows={3}
              placeholder="e.g. Generate a question paper for 3 hour exam duration.."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
            <button type="button" className="absolute bottom-4 right-4 text-[#98A2B3] transition-colors hover:text-[#101828]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 18.5V22M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push('/assignments')}
              className="flex items-center gap-2 rounded-full border border-[#E4E7EC] bg-white px-5 py-3 text-sm font-semibold text-[#101828] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-colors hover:bg-gray-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                if (!dueDate) {
                  alert('Please select a due date.');
                  return;
                }
                setStep(1);
              }}
              className="flex items-center gap-2 rounded-full bg-[#101828] px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(16,24,40,0.18)] transition-transform hover:scale-105 active:scale-95"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
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
          { label: 'Title', value: generatedAssignmentTitle },
          { label: 'Subject', value: assignmentSubject },
          { label: 'Due Date', value: dueDate },
          { label: 'Total Questions', value: String(totalQ) },
          { label: 'Total Marks', value: String(totalM) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-900">{value || '—'}</span>
          </div>
        ))}

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
          type="button"
          onClick={submit}
          disabled={submitting}
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
      {step === 0 ? renderStep0() : renderStep1()}
    </div>
  );
}
