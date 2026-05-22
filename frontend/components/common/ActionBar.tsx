'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, Printer } from 'lucide-react';
import { PaperAPI } from '../../lib/api';
import { useGenerationStore } from '../../stores/generationStore';
import { cn } from '../../lib/utils';

interface ActionBarProps {
  assignmentId: string;
  className?:   string;
}

export function ActionBar({ assignmentId, className }: ActionBarProps) {
  const router           = useRouter();
  const { setIds, setStatus } = useGenerationStore();
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!confirm('Regenerate this question paper? The current paper will be replaced.')) return;
    setRegenerating(true);
    try {
      const result = await PaperAPI.regenerate(assignmentId);
      setIds(assignmentId, result.jobId);
      setStatus('queued', 0);
      router.push(`/assignments/${assignmentId}/status`);
    } catch (err) {
      alert('Failed to start regeneration. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className={cn('flex flex-wrap items-center gap-3 no-print', className)}>
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={cn('h-4 w-4', regenerating && 'animate-spin')} />
        {regenerating ? 'Starting...' : 'Regenerate'}
      </button>

      <button
        onClick={handlePrint}
        className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
      >
        <Printer className="h-4 w-4" />
        Print / Save PDF
      </button>
    </div>
  );
}
