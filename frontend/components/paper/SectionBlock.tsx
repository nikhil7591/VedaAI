import { Section } from '../../types';
import { QuestionCard } from './QuestionCard';

interface Props {
  section:     Section;
  startNumber: number;
}

export function SectionBlock({ section, startNumber }: Props) {
  return (
    <section>
      {/* Section header */}
      <div className="mb-4 flex items-baseline justify-between border-b border-gray-200 pb-2">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-800">
            Section {section.sectionLabel} — {section.title}
          </h2>
          <p className="mt-0.5 text-xs italic text-gray-500">{section.instruction}</p>
        </div>
        <span className="ml-4 flex-shrink-0 text-xs font-semibold text-gray-500">
          [{section.totalMarks} marks]
        </span>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {section.questions.map((q, idx) => (
          <QuestionCard
            key={idx}
            question={q}
            number={startNumber + idx}
          />
        ))}
      </div>
    </section>
  );
}
