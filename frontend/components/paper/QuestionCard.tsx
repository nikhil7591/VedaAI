import { Question } from '../../types';
import { DifficultyBadge } from './DifficultyBadge';

interface Props {
  question: Question;
  number:   number;
}

const MCQ_OPTS = ['A', 'B', 'C', 'D'];

export function QuestionCard({ question, number }: Props) {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  return (
    <div className="flex flex-col items-start mb-4">
      <p className="text-sm leading-relaxed text-gray-900">
        <span className="font-bold mr-1">{number}.</span>
        <span className="mr-1">[{capitalize(question.difficulty)}]</span>
        <span>{question.text}</span>
        <span className="ml-1">[{question.marks} Marks]</span>
      </p>

      {/* MCQ options */}
      {question.type === 'MCQ' && question.options && (
        <div className="mt-2.5 ml-6 grid grid-cols-2 gap-x-6 gap-y-1">
          {question.options.map((opt, i) => (
            <p key={i} className="text-sm text-gray-700">
              <span className="mr-1.5 font-medium text-gray-500">({MCQ_OPTS[i]})</span>{opt}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
