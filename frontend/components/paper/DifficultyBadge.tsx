import { DifficultyLevel } from '../../types';
import { cn } from '../../lib/utils';

const STYLES: Record<DifficultyLevel, string> = {
  easy:   'bg-green-50 text-green-700 border-green-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  hard:   'bg-red-50 text-red-600 border-red-100',
};

export function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold capitalize',
      STYLES[difficulty]
    )}>
      {difficulty}
    </span>
  );
}
