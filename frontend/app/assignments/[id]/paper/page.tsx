'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, AlertCircle, RefreshCw,
  Download, ChevronLeft, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PaperAPI, ProfileAPI } from '../../../../lib/api';
import { usePaperStore } from '../../../../stores/paperStore';
import { QuestionPaper } from '../../../../components/paper/QuestionPaper';

export default function PaperPage() {
  const { id: assignmentId } = useParams<{ id: string }>();
  const router = useRouter();
  const { paper, isLoading, error, setPaper, setLoading, setError } = usePaperStore();
  const [profile, setProfile] = useState<{name: string, address: string} | null>(null);

  useEffect(() => {
    ProfileAPI.get().then(p => {
      if (p) setProfile({ name: p.name, address: p.address });
    }).catch(console.error);
  }, []);
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
        <div className="no-print mb-4 rounded-[24px] bg-[#222222] p-6 shadow-sm">
          <p className="text-[15px] font-bold leading-relaxed text-white">
            {`Certainly! Here is your customized Question Paper for your ${paper.subject} classes on ${paper.title}:`}
          </p>
          <button
            onClick={() => window.print()}
            className="mt-4 flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
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
        <QuestionPaper paper={paper} profileName={profile?.name} />
      </div>
    </AppShell>
  );
}
