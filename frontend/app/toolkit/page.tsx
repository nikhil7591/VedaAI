'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/layout/AppShell';
import { FileText, CheckSquare, Star, BarChart2, PenTool, Zap, ArrowRight } from 'lucide-react';

const TOOLS = [
  { icon: FileText,    color: '#E5442D', bg: '#FEF3F0', title: 'Question Paper Generator', desc: 'Generate structured question papers for any subject using Groq AI', href: '/create', tag: 'Popular' },
  { icon: CheckSquare, color: '#3B82F6', bg: '#EFF6FF', title: 'Auto Grader',               desc: 'Upload student submissions and let AI grade them automatically',    href: '#',       tag: 'Coming Soon' },
  { icon: Star,        color: '#8B5CF6', bg: '#F5F3FF', title: 'Rubric Builder',             desc: 'Create detailed marking rubrics for fair and consistent grading',   href: '#',       tag: 'Coming Soon' },
  { icon: BarChart2,   color: '#10B981', bg: '#ECFDF5', title: 'Analytics Dashboard',        desc: 'Track student performance trends across assignments and subjects',   href: '#',       tag: 'Coming Soon' },
  { icon: PenTool,     color: '#F59E0B', bg: '#FFFBEB', title: 'Feedback Generator',         desc: 'Generate personalised AI feedback for each student response',        href: '#',       tag: 'Coming Soon' },
  { icon: Zap,         color: '#EC4899', bg: '#FDF2F8', title: 'Quick Quiz Creator',         desc: 'Build quick 5-question formative assessments in under 30 seconds',  href: '#',       tag: 'Beta' },
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
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{t.desc}</p>
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
