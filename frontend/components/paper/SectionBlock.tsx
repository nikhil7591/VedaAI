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
      <div className="mb-6 mt-8">
        <h2 className="text-lg font-bold text-center text-gray-900 mb-4">
          Section {section.sectionLabel}
        </h2>
        <h3 className="text-sm font-bold text-gray-900 mb-1">
          {section.title}
        </h3>
        <p className="text-xs italic text-gray-700">{section.instruction}</p>
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
