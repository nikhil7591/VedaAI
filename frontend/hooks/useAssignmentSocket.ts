'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socket';
import { useGenerationStore } from '../stores/generationStore';
import {
  WsGenerationStarted,
  WsGenerationProgress,
  WsGenerationCompleted,
  WsGenerationFailed,
} from '../types';

export function useAssignmentSocket(assignmentId: string | null): void {
  const router       = useRouter();
  const { setStatus, setProgress } = useGenerationStore();
  const joined       = useRef(false);

  useEffect(() => {
    if (!assignmentId || joined.current) return;

    const socket = getSocket();
    joined.current = true;

    const join = () => {
      socket.emit('join', { assignmentId });
    };

    // Join immediately if connected, or on connect
    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    const onStarted = (_data: WsGenerationStarted) => {
      setStatus('processing', 5, null, 'Starting generation...');
    };

    const onProgress = (data: WsGenerationProgress) => {
      setProgress(data.progress, data.stage);
    };

    const onCompleted = (data: WsGenerationCompleted) => {
      setStatus('completed', 100, null, 'Done!');
      router.push(`/assignments/${data.assignmentId}/paper`);
    };

    const onFailed = (data: WsGenerationFailed) => {
      setStatus('failed', 0, data.message);
    };

    // Re-join on reconnect (in case we missed events)
    const onReconnect = () => {
      join();
    };

    socket.on('generation:started',   onStarted);
    socket.on('generation:progress',  onProgress);
    socket.on('generation:completed', onCompleted);
    socket.on('generation:failed',    onFailed);
    socket.on('reconnect',            onReconnect);

    return () => {
      socket.emit('leave', { assignmentId });
      socket.off('generation:started',   onStarted);
      socket.off('generation:progress',  onProgress);
      socket.off('generation:completed', onCompleted);
      socket.off('generation:failed',    onFailed);
      socket.off('reconnect',            onReconnect);
      socket.off('connect',              join);
      joined.current = false;
    };
  }, [assignmentId, router, setStatus, setProgress]);
}
