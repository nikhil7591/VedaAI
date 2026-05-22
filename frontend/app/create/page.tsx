'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/layout/AppShell';
import { AssignmentForm } from '../../components/forms/AssignmentForm';
import { Suspense } from 'react';

export default function CreatePage() {
  const router = useRouter();
  
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-5 md:p-8 pb-32">
        <div className="relative flex items-center justify-center mb-8 mt-2 h-14">
          <button 
            onClick={() => router.back()} 
            className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-full bg-[#E5E7EB]/80 hover:bg-gray-300 transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">
            Create Assignment
          </h1>
        </div>
        <Suspense fallback={<div>Loading form...</div>}>
          <AssignmentForm />
        </Suspense>
      </div>
    </AppShell>
  );
}
