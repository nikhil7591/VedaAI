'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AssignmentAPI } from '../lib/api';
import { useGenerationStore } from '../stores/generationStore';

const POLL_INTERVAL_MS = 5000;

/**
 * Polling fallback — kicks in when WebSocket is disconnected or as a safety net.
 * Polls GET /assignments/:id/status every 5 seconds.
 */
export function useGenerationStatus(assignmentId: string | null): void {
  const router  = useRouter();
  const { status, setStatus, setProgress } = useGenerationStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!assignmentId || status === 'completed' || status === 'failed') return;

    const poll = async () => {
      try {
        const data = await AssignmentAPI.getStatus(assignmentId);

        if (data.status === 'completed') {
          setStatus('completed', 100);
          router.push(`/assignments/${assignmentId}/paper`);
          clearInterval(timerRef.current!);
        } else if (data.status === 'failed') {
          setStatus('failed', 0, data.errorMessage ?? 'Generation failed');
          clearInterval(timerRef.current!);
        } else {
          setProgress(data.progress, '');
        }
      } catch {
        // Silent — WS is the primary channel, polling is fallback
      }
    };

    // Fire immediately so the UI reflects real DB state on mount (no 5-second blank wait)
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current!);
  }, [assignmentId, status, router, setStatus, setProgress]);
}
