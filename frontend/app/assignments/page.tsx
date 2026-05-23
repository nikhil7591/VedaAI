'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, SlidersHorizontal,
  MoreVertical, Eye, Trash2, Loader2,
  Clock, CheckCircle, XCircle,
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { AssignmentAPI } from '../../lib/api';
import { Assignment } from '../../types';
import { cn } from '../../lib/utils';

import { AssignmentCard } from '../../components/cards/AssignmentCard';

/* ── Page ── */
export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');

  useEffect(() => {
    AssignmentAPI.list(1, 50)
      .then((r) => setAssignments(r.assignments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment? This cannot be undone.')) return;
    // Optimistic update — remove immediately from UI
    setAssignments((prev) => prev.filter((a) => a._id !== id));
    try {
      await AssignmentAPI.delete(id);
    } catch {
      // Roll back on failure
      alert('Failed to delete assignment. Please refresh and try again.');
      AssignmentAPI.list(1, 50)
        .then((r) => setAssignments(r.assignments))
        .catch(() => {});
    }
  };

  const isEmpty = !loading && assignments.length === 0;

  return (
    <AppShell assignmentCount={assignments.length}>
      {loading ? (
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-gray-300" />
        </div>
      ) : isEmpty ? (
        /* ── Empty state ── */
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 w-64 select-none">
            <Image
              src="/illustrations.png"
              alt="No assignments yet"
              width={280}
              height={260}
              priority
              className="w-full"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No assignments yet</h2>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-gray-500">
            Create your first assignment to start collecting and grading student
            submissions. You can set up rubrics, define marking criteria, and let
            AI assist with grading.
          </p>
          <Link href="/create" className="mt-8 flex items-center justify-center gap-2 rounded-full bg-[#1A1A1A] px-8 py-4 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] w-full max-w-sm">
            <Plus className="h-5 w-5" strokeWidth={3} />
            Create Your First Assignment
          </Link>

          {/* Mobile FAB (White with Orange Plus to match Figma) */}
          <Link
            href="/create"
            aria-label="Create assignment"
            className="fixed bottom-[90px] right-5 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#E5442D] shadow-[0_4px_20px_rgba(0,0,0,0.15)] md:hidden z-40 transition-transform active:scale-95"
          >
            <Plus className="h-7 w-7" strokeWidth={3} />
          </Link>
        </div>
      ) : (
        /* ── List ── */
        <div className="px-5 py-6 md:p-8 pb-32">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
              <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Assignments</h1>
            </div>
            <p className="text-sm text-gray-500 font-medium ml-4">
              Manage and create assignments for your classes.
            </p>
          </div>

          {/* Filter + Search (Single Row) */}
          <div className="flex items-center gap-3 mb-6 bg-white rounded-full p-1 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2 border-r border-gray-100 text-sm text-gray-500 font-medium whitespace-nowrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filter By
            </div>
            <div className="relative flex-1 flex items-center">
              <Search className="h-4 w-4 text-gray-400 ml-2 mr-2" />
              <input
                type="text"
                placeholder="Search Assignment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent py-2 pr-4 text-sm font-medium outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
              {filtered.map((a) => (
                <AssignmentCard key={a._id} a={a} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-sm font-medium text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
              No assignments match &quot;{search}&quot;
            </div>
          )}

          {/* Mobile FAB */}
          <Link
            href="/create"
            aria-label="Create assignment"
            className="fixed bottom-[90px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#E5442D] shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-transform active:scale-95 md:hidden"
          >
            <Plus className="h-7 w-7" strokeWidth={3} />
          </Link>

          {/* Desktop Create Button */}
          <div className="fixed bottom-6 left-0 right-0 md:left-[252px] hidden justify-center z-40 pointer-events-none md:flex">
            <Link
              href="/create"
              className="flex items-center gap-2 rounded-full bg-[#1A1A1A] px-6 py-3.5 text-sm font-bold text-white shadow-lg pointer-events-auto transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
              Create Assignment
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
