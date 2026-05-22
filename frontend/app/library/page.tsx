'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { AssignmentAPI } from '../../lib/api';
import { Assignment } from '../../types';
import { useRouter } from 'next/navigation';
import { FileText, Download, Eye, Search, Loader2, BookOpen } from 'lucide-react';

export default function LibraryPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    AssignmentAPI.list(1, 100)
      .then((r) => setPapers(r.assignments.filter((a) => a.status === 'completed')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = papers.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.subject.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <AppShell>
      <div className="p-5 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">My Library</h1>
          <p className="mt-0.5 text-sm text-gray-400">All your generated question papers in one place</p>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search papers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <BookOpen className="h-7 w-7 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700">
              {search ? 'No papers match your search' : 'No question papers yet'}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {search
                ? 'Try a different keyword'
                : 'Generate your first question paper from the Assignments page'}
            </p>
            {!search && (
              <Link href="/create" className="btn-brand mt-5">Create Assignment</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p._id} className="card flex flex-col gap-0 overflow-hidden transition-shadow hover:shadow-md">
                {/* Preview band */}
                <div className="flex items-center justify-center bg-gray-50 py-8 border-b border-gray-100">
                  <div className="relative">
                    <FileText className="h-12 w-12 text-gray-200" />
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                      <span className="text-[8px] font-bold text-white">✓</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4">
                  <div>
                    <h3 className="line-clamp-2 text-sm font-bold text-gray-900">{p.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-400">{p.subject}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{p.totalQuestions}Q · {p.totalMarks} marks</span>
                    <span>{fmt(p.createdAt)}</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/assignments/${p._id}/paper`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                    <button
                      onClick={() => router.push(`/assignments/${p._id}/paper`)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FEF3F0] py-2 text-xs font-semibold text-[#E5442D] hover:bg-[#FCDDD7] transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
