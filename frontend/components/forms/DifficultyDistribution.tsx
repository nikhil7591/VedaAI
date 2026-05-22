'use client';

import { DifficultyDistribution as IDD } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  value:    IDD;
  onChange: (key: keyof IDD, value: number) => void;
  error?:   string;
}

const LEVELS = [
  { key: 'easy'   as keyof IDD, label: 'Easy',   bar: 'bg-green-400',  text: 'text-green-700' },
  { key: 'medium' as keyof IDD, label: 'Medium',  bar: 'bg-amber-400',  text: 'text-amber-700' },
  { key: 'hard'   as keyof IDD, label: 'Hard',    bar: 'bg-red-400',    text: 'text-red-700'   },
];

export function DifficultyDistribution({ value, onChange, error }: Props) {
  const total   = value.easy + value.medium + value.hard;
  const isValid = total === 100;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">Adjust sliders — must total 100%</span>
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-semibold',
          isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        )}>
          {total}% {isValid ? '✓' : '≠ 100%'}
        </span>
      </div>

      <div className="space-y-4">
        {LEVELS.map(({ key, label, bar, text }) => (
          <div key={key}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className={cn('text-xs font-semibold', text)}>{label}</span>
              <span className="text-xs font-bold text-gray-700">{value[key]}%</span>
            </div>
            <div className="relative">
              {/* Track visual */}
              <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn('h-full rounded-full transition-all', bar)}
                  style={{ width: `${value[key]}%` }}
                />
              </div>
              <input
                type="range"
                min={0} max={100} step={5}
                value={value[key]}
                onChange={(e) => onChange(key, parseInt(e.target.value))}
                className="w-full cursor-pointer appearance-none"
                style={{ accentColor: key === 'easy' ? '#4ade80' : key === 'medium' ? '#fbbf24' : '#f87171' }}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
