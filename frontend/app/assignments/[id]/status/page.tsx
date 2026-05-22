'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '../../../../components/layout/AppShell';
import { useGenerationStore } from '../../../../stores/generationStore';
import { useAssignmentSocket } from '../../../../hooks/useAssignmentSocket';
import { useGenerationStatus } from '../../../../hooks/useGenerationStatus';
import { PaperAPI } from '../../../../lib/api';
import { cn } from '../../../../lib/utils';

const STEPS = [
  { label: 'Assignment saved to database',  pct: 5   },
  { label: 'Prompt built from config',       pct: 15  },
  { label: 'Groq AI request sent',           pct: 30  },
  { label: 'AI response received',           pct: 70  },
  { label: 'Questions validated',            pct: 85  },
  { label: 'Paper saved to database',        pct: 95  },
  { label: 'All done!',                      pct: 100 },
];

export default function StatusPage() {
  const { id: assignmentId } = useParams<{ id: string }>();
  const router = useRouter();
  const { status, progress, stage, errorMessage, assignmentId: storedId, setIds } =
    useGenerationStore();

  useEffect(() => {
    if (assignmentId && !storedId) setIds(assignmentId, '');
  }, [assignmentId, storedId, setIds]);

  useAssignmentSocket(assignmentId ?? null);
  useGenerationStatus(assignmentId ?? null);

  const isFailed    = status === 'failed';
  const isCompleted = status === 'completed';

  const handleRegenerate = async () => {
    if (!assignmentId) return;
    try {
      const r = await PaperAPI.regenerate(assignmentId);
      setIds(assignmentId, r.jobId);
      window.location.reload();
    } catch {
      alert('Failed to regenerate. Please try again.');
    }
  };

  return (
    <AppShell>
      <div className="flex min-h-[80vh] items-center justify-center p-5">
        <div className="w-full max-w-md">
          <div className="card overflow-hidden">
            {/* Orange progress stripe */}
            <div className="h-1.5 w-full bg-gray-100">
              <div
                className={cn(
                  'h-full transition-all duration-700',
                  isFailed    ? 'bg-red-400' :
                  isCompleted ? 'bg-green-400' : 'bg-[#E5442D]'
                )}
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>

            <div className="p-8">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                {isFailed ? (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
                    <XCircle className="h-10 w-10 text-red-400" />
                  </div>
                ) : isCompleted ? (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-50">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                ) : (
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FEF3F0]">
                    <Image
                      src="/logo.png"
                      alt="Generating"
                      width={44}
                      height={44}
                      className="rounded-xl animate-pulse"
                    />
                    <div className="absolute -right-1.5 -top-1.5">
                      <Loader2 className="h-5 w-5 animate-spin text-[#E5442D]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-center text-lg font-bold text-gray-900">
                {isFailed    ? 'Generation Failed' :
                 isCompleted ? 'Paper Ready!'       :
                 'Generating Question Paper'}
              </h1>
              <p className="mt-1.5 text-center text-sm text-gray-500">
                {stage ||
                 (isFailed    ? 'An error occurred. Try regenerating below.' :
                  isCompleted ? 'Redirecting to your paper...'              :
                  'Groq AI is generating your question paper...')}
              </p>

              {/* Progress bar */}
              {!isFailed && (
                <div className="mt-6">
                  <div className="mb-1.5 flex justify-between text-xs text-gray-400">
                    <span>{isCompleted ? 'Complete' : 'Progress'}</span>
                    <span className="font-semibold text-gray-600">{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        isCompleted ? 'bg-green-400' : 'bg-[#E5442D]'
                      )}
                      style={{ width: `${Math.max(5, progress)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error detail */}
              {isFailed && errorMessage && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorMessage}
                </div>
              )}

              {/* Steps checklist */}
              {!isFailed && (
                <div className="mt-5 space-y-2.5">
                  {STEPS.map(({ label, pct }) => {
                    const done = progress >= pct;
                    return (
                      <div key={label} className="flex items-center gap-3 text-sm">
                        <div className={cn(
                          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
                          done ? 'bg-green-100' : 'bg-gray-100'
                        )}>
                          {done
                            ? <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            : <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                          }
                        </div>
                        <span className={done ? 'text-gray-800' : 'text-gray-400'}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fail actions */}
              {isFailed && (
                <div className="mt-6 flex gap-3">
                  <Link
                    href="/assignments"
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleRegenerate}
                    className="btn-dark flex-1 rounded-xl py-2.5"
                  >
                    <RefreshCw className="h-4 w-4" /> Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
