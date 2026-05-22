'use client';

import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value:     number;   // 0–100
  stage?:    string;
  className?: string;
  animated?: boolean;
}

export function ProgressBar({ value, stage, className, animated = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {stage && (
        <p className="mb-2 text-sm font-medium text-gray-600">{stage}</p>
      )}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-500',
            animated && clamped < 100 && 'animate-pulse'
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-1 text-right text-xs text-gray-500">{clamped}%</p>
    </div>
  );
}
