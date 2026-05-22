'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, AlertCircle, RefreshCw,
  Download, ChevronLeft, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PaperAPI } from '../../../../lib/api';
import { usePaperStore } from '../../../../stores/paperStore';
import { QuestionPaper } from '../../../../components/paper/QuestionPaper';

export default function PaperPage() {
  const { id: assignmentId } = useParams<{ id: string }>();
  const router = useRouter();
  const { paper, isLoading, error, setPaper, setLoading, setError } = usePaperStore();

  useEffect(() => {
    if (!assignmentId) return;
    if (paper?.assignmentId === assignmentId) return;
    setLoading(true);
    PaperAPI.get(assignmentId)
      .then(setPaper)
      .catch((err: any) => {
        if (err?.code === 'NOT_READY')
          router.push(`/assignments/${assignmentId}/status`);
        else
          setError(err?.message ?? 'Failed to load question paper');
      });
  }, [assignmentId, paper, setPaper, setLoading, setError, router]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-gray-300" />
            <p className="text-sm text-gray-400">Loading question paper...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center p-6">
          <div className="card w-full max-w-sm p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
            <h2 className="font-semibold text-gray-800">Failed to Load Paper</h2>
            <p className="mt-1 text-sm text-gray-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-dark mt-5"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!paper) return null;

  return (
    <AppShell>
      <div className="p-4 md:p-6 print:p-0">

        {/* ── AI Banner — dark background matching design ── */}
        <div className="no-print mb-4 flex items-center justify-between gap-4 rounded-2xl bg-[#1A1A2E] px-5 py-4 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E5442D]" />
            <p className="text-sm leading-relaxed text-gray-200">
              <span className="font-semibold text-white">Certainly!</span>{' '}
              Here is your customized Question Paper for{' '}
              <span className="font-semibold text-white">{paper.subject}</span>{' '}
              — {paper.title}. Generated using Groq AI.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex flex-shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download as PDF
          </button>
        </div>

        {/* ── Action row ── */}
        <div className="no-print mb-4 flex items-center justify-between">
          <Link
            href="/assignments"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <ChevronLeft className="h-4 w-4" /> Assignments
          </Link>
          <button
            onClick={async () => {
              if (!assignmentId) return;
              try {
                await PaperAPI.regenerate(assignmentId);
                router.push(`/assignments/${assignmentId}/status`);
              } catch {
                alert('Failed to regenerate. Please try again.');
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </button>
        </div>

        {/* ── Paper ── */}
        <QuestionPaper paper={paper} />
      </div>
    </AppShell>
  );
}
