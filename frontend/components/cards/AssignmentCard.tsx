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

  const openAssignment = () => {
    router.push(viewHref);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openAssignment}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openAssignment();
        }
      }}
      className="card flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="group flex-1">
          <h3 className="text-lg font-black tracking-tight leading-snug text-gray-900 group-hover:text-[#E5442D] transition-colors">
            {a.title}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-gray-500">
            {a.subject}
          </p>
        </div>

        {/* 3-dot menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {open && (
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); openAssignment(); }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 text-gray-400" />
                View Assignment
              </button>
              <div className="h-[1px] bg-gray-100 w-full" />
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(a._id); }}
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
      <div className="mt-4 flex items-center justify-between text-[12px] font-bold text-gray-800">
        <span>Assigned on : {fmt(a.createdAt)}</span>
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
