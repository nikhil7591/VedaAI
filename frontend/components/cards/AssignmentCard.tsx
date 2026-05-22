'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Eye, Trash2, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Assignment } from '../../types';
import { cn } from '../../lib/utils';

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:    { label: 'Queued',     cls: 'bg-gray-100 text-gray-500',  icon: Clock       },
  processing: { label: 'Processing', cls: 'bg-blue-50 text-blue-600',   icon: Loader2     },
  completed:  { label: 'Done',       cls: 'bg-green-50 text-green-700', icon: CheckCircle },
  failed:     { label: 'Failed',     cls: 'bg-red-50 text-red-500',     icon: XCircle     },
};

export function AssignmentCard({
  a, onDelete,
}: {
  a: Assignment;
  onDelete: (id: string) => void;
}) {
  const router  = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

  const viewHref =
    a.status === 'completed'
      ? `/assignments/${a._id}/paper`
      : `/assignments/${a._id}/status`;

  const cfg  = STATUS_STYLES[a.status] ?? STATUS_STYLES.pending;
  const Icon = cfg.icon;

  return (
    <div className="card flex flex-col gap-3 p-5 rounded-3xl bg-white shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h3
          className="flex-1 cursor-pointer text-base font-bold leading-snug text-gray-900 hover:text-[#E5442D] transition-colors"
          onClick={() => router.push(viewHref)}
        >
          {a.title}
        </h3>

        {/* 3-dot menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {open && (
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
              <button
                onClick={() => { setOpen(false); router.push(viewHref); }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 text-gray-400" />
                View Assignment
              </button>
              <div className="h-[1px] bg-gray-100 w-full" />
              <button
                onClick={() => { setOpen(false); onDelete(a._id); }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dates line - Exact match to Figma */}
      <div className="mt-2 text-[13px] font-bold text-gray-800 flex items-center gap-2">
        <span>Assigned on : {fmt(a.createdAt)}</span>
        <span className="text-gray-300 font-normal">|</span>
        <span>Due : {a.dueDate ? fmt(a.dueDate) : 'N/A'}</span>
      </div>

      {/* Optional: We can still show the status badge if it's processing or failed so the user knows */}
      {a.status !== 'completed' && (
        <div className="mt-1 flex">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
            cfg.cls
          )}>
            <Icon className={cn('h-3 w-3', a.status === 'processing' && 'animate-spin')} strokeWidth={3} />
            {cfg.label}
          </span>
        </div>
      )}
    </div>
  );
}
