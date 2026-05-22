'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';

interface Props {
  children:        React.ReactNode;
  assignmentCount?: number;
}

export function AppShell({ children, assignmentCount = 0 }: Props) {
  return (
    <div className="flex min-h-screen bg-[#F5F6F8]">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar assignmentCount={assignmentCount} />
      </div>

      {/* Main column */}
      <div className="flex flex-1 flex-col md:ml-[252px]">
        <TopBar />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
