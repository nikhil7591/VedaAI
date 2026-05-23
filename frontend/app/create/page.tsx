'use client';

import { AppShell } from '../../components/layout/AppShell';
import { AssignmentForm } from '../../components/forms/AssignmentForm';
import { Suspense } from 'react';

export default function CreatePage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-28 pt-4 md:px-6 md:pt-6">
        <Suspense fallback={<div>Loading form...</div>}>
          <AssignmentForm />
        </Suspense>
      </div>
    </AppShell>
  );
}
