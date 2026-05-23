'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/layout/AppShell';
import { FileText, CheckSquare, Star, BarChart2, PenTool, Zap, ArrowRight } from 'lucide-react';

const TOOLS = [
  {
    icon: FileText,
    color: '#E5442D',
    bg: '#FEF3F0',
    title: 'Question Paper Generator',
    href: '/create',
    tag: 'Popular',
    details: [
      'What: AI tool to create class-wise and subject-wise question papers.',
      'Does: Builds sections, marks distribution, and balanced question types.',
      'How to use: Open the tool, fill class/subject + pattern, then generate and review.',
    ],
  },
  {
    icon: CheckSquare,
    color: '#3B82F6',
    bg: '#EFF6FF',
    title: 'Auto Grader',
    href: '/toolkit/auto-grader',
    tag: 'New',
    details: [
      'What: Smart evaluator for student answers.',
      'Does: Scores responses, gives grade %, and highlights strengths/improvements.',
      'How to use: Paste question + answer key + student response, set marks, click Grade.',
    ],
  },
  {
    icon: Star,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    title: 'Rubric Builder',
    href: '/toolkit/rubric-builder',
    tag: 'New',
    details: [
      'What: Rubric designer for consistent marking.',
      'Does: Creates criteria levels and mark bands for fair evaluation.',
      'How to use: Choose assessment type, add criteria, set weights, then save rubric.',
    ],
  },
  {
    icon: BarChart2,
    color: '#10B981',
    bg: '#ECFDF5',
    title: 'Analytics Dashboard',
    href: '/toolkit/analytics',
    tag: 'New',
    details: [
      'What: Performance insights panel for classes and assignments.',
      'Does: Shows trends, weak topics, average scores, and progress patterns.',
      'How to use: Select class/date range, compare metrics, and act on low-performing areas.',
    ],
  },
  {
    icon: PenTool,
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: 'Feedback Generator',
    href: '/toolkit/feedback-generator',
    tag: 'New',
    details: [
      'What: AI assistant to draft student-specific feedback.',
      'Does: Produces clear, actionable comments based on response quality.',
      'How to use: Add student answer/context, choose tone, generate and personalize before sending.',
    ],
  },
  {
    icon: Zap,
    color: '#EC4899',
    bg: '#FDF2F8',
    title: 'Quick Quiz Creator',
    href: '/toolkit/quick-quiz',
    tag: 'Beta',
    details: [
      'What: Fast quiz maker for revision and formative checks.',
      'Does: Creates short, topic-focused questions with ready-to-use format.',
      'How to use: Enter topic + difficulty + count, generate quiz, edit, and share instantly.',
    ],
  },
];

export default function ToolkitPage() {
  const router = useRouter();
  return (
    <AppShell>
      <div className="p-5 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">AI Teacher&apos;s Toolkit</h1>
          <p className="mt-0.5 text-sm text-gray-400">Powerful AI tools to save time and improve student outcomes</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const clickable = t.href !== '#';
            return (
              <div
                key={t.title}
                onClick={() => clickable && router.push(t.href)}
                className={`card flex flex-col gap-4 p-5 transition-shadow ${clickable ? 'cursor-pointer hover:shadow-md' : 'opacity-80'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: t.bg }}>
                    <Icon className="h-6 w-6" style={{ color: t.color }} />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${t.tag === 'Popular' ? 'bg-[#FEF3F0] text-[#E5442D]' : t.tag === 'Beta' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                    {t.tag}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{t.title}</h3>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-gray-500">
                    {t.details.map((line) => (
                      <li key={line}>
                        <span className="mr-1 inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-700">
                          {line.split(':')[0]}
                        </span>
                        <span className="text-[12px] text-gray-600">
                          {line.split(':').slice(1).join(':').trim()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: clickable ? t.color : '#9CA3AF' }}>
                  {clickable ? 'Launch tool' : 'Coming soon'}
                  {clickable && <ArrowRight className="h-3.5 w-3.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
