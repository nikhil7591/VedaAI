'use client';

import { QuestionType } from '../../types';
import { cn } from '../../lib/utils';

const TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: 'MCQ',        label: 'MCQ',          desc: 'Multiple choice, 4 options'  },
  { value: 'SHORT',      label: 'Short Answer',  desc: '3–5 sentence responses'      },
  { value: 'LONG',       label: 'Long Answer',   desc: 'Extended essay answers'      },
  { value: 'TRUE_FALSE', label: 'True / False',  desc: 'Binary true or false'        },
];

interface Props {
  selected: QuestionType[];
  onChange: (type: QuestionType, checked: boolean) => void;
  error?:   string;
}

export function QuestionTypeSelector({ selected, onChange, error }: Props) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {TYPES.map(({ value, label, desc }) => {
          const active = selected.includes(value);
          return (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all',
                active
                  ? 'border-[#E5442D]/30 bg-[#FEF0ED]'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
              )}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => onChange(value, e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#E5442D]"
              />
              <div>
                <p className={cn('text-xs font-semibold', active ? 'text-[#E5442D]' : 'text-gray-700')}>
                  {label}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
              </div>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
