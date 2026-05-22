'use client';

import { useState, useRef, useEffect } from 'react';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    { 
      id: 1, 
      title: 'Paper generated', 
      short: 'Your question paper is ready.',
      body: 'Your AI-generated question paper for Class 10 Physics is ready to view. Click here to download or review it before assigning.' 
    },
    { 
      id: 2, 
      title: 'Assignment graded', 
      short: 'AI grading completed.',
      body: 'AI grading has successfully completed for Assignment 3 (Chemistry). 28 student submissions were evaluated. Review the analytics dashboard for insights.' 
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-full bg-[#F3F4F6] md:bg-transparent hover:bg-gray-200 transition-colors"
      >
        <svg className="h-[22px] w-[22px] md:h-5 md:w-5 text-gray-700 md:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3.6c0 .538-.214 1.055-.595 1.395L4 17h5" />
        </svg>
        <span className="absolute right-0.5 top-0.5 md:right-0 md:top-0 h-2.5 w-2.5 md:h-2 md:w-2 rounded-full bg-[#E5442D] ring-2 ring-[#F3F4F6] md:ring-white" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
          <div className="p-2">
            <h4 className="px-2 py-1 text-sm font-semibold">Notifications</h4>
            <div className="max-h-48 overflow-auto">
              {items.map((it) => (
                <div
                  key={it.id}
                  onClick={() => setActive(active === it.id ? null : it.id)}
                  className="cursor-pointer px-3 py-2 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="text-sm font-semibold text-gray-800">{it.title}</div>
                  {!active || active !== it.id ? (
                    <div className="text-xs text-gray-500 truncate">{it.short}</div>
                  ) : null}
                  
                  {active === it.id && (
                    <div className="mt-2 rounded-xl bg-gray-100 p-3 text-xs text-gray-700 leading-relaxed border border-gray-200">
                      {it.body}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
