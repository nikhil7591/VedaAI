import { Question } from '../../types';
import { DifficultyBadge } from './DifficultyBadge';

interface Props {
  question: Question;
  number:   number;
}

const MCQ_OPTS = ['A', 'B', 'C', 'D'];

export function QuestionCard({ question, number }: Props) {
  return (
    <div className="flex items-start gap-3">
      {/* Number */}
      <span className="mt-0.5 w-6 flex-shrink-0 text-sm font-bold text-gray-700">{number}.</span>

      {/* Body */}
      <div className="flex-1">
        <p className="text-sm leading-relaxed text-gray-900">{question.text}</p>

        {/* MCQ options */}
        {question.type === 'MCQ' && question.options && (
          <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-1">
            {question.options.map((opt, i) => (
              <p key={i} className="text-sm text-gray-700">
                <span className="mr-1.5 font-medium text-gray-500">({MCQ_OPTS[i]})</span>{opt}
              </p>
            ))}
          </div>
        )}

        {/* Answer lines for written types */}
        {question.type !== 'MCQ' && (
          <div className="mt-3 space-y-2">
            {Array.from({ length: question.type === 'LONG' ? 6 : question.type === 'TRUE_FALSE' ? 1 : 3 }).map((_, i) => (
              <div key={i} className="h-px w-full border-b border-dashed border-gray-300" />
            ))}
          </div>
        )}
      </div>

      {/* Right meta */}
      <div className="flex flex-shrink-0 flex-col items-end gap-1 pl-2">
        <span className="text-xs text-gray-400">[{question.marks}m]</span>
        <DifficultyBadge difficulty={question.difficulty} />
      </div>
    </div>
  );
}
