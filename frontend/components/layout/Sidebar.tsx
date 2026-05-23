'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, Users, BookOpen, Sparkles,
  Library, Settings, Plus, MapPin,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { SchoolProfileModal } from '../modals/SchoolProfileModal';
import { ProfileAPI } from '../../lib/api';

const NAV = [
  { href: '/',            icon: LayoutGrid, label: 'Home'                 },
  { href: '/groups',      icon: Users,      label: 'My Groups'             },
  { href: '/assignments', icon: BookOpen,   label: 'Assignments', badge: 0 },
  { href: '/toolkit',     icon: Sparkles,   label: "AI Teacher's Toolkit"  },
  { href: '/library',     icon: Library,    label: 'My Library'            },
];

export function Sidebar({ assignmentCount = 0 }: { assignmentCount?: number }) {
  const path = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<{name: string, address: string} | null>(null);

  const fetchProfile = () => {
    ProfileAPI.invalidateCache();
    ProfileAPI.get().then(p => {
      if (p) setProfile({ name: p.name, address: p.address });
    }).catch(console.error);
  };

  useEffect(() => {
    ProfileAPI.get().then(p => {
      if (p) setProfile({ name: p.name, address: p.address });
    }).catch(console.error);
  }, []);

  const active = (href: string) => {
    if (href === '/') return path === '/';
    if (href === '/assignments') return path === '/assignments';
    return path === href || path.startsWith(href + '/');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-gray-100 bg-white">
      <div className="mt-[6px] flex h-16 items-center gap-2 px-5 border-b border-gray-100">
        <div className="-ml-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-b from-[#F56A43] to-[#C23B22] shadow-[0_10px_20px_rgba(194,59,34,0.28)]">
          <span className="text-[22px] font-black leading-none text-white">V</span>
        </div>
        <span className="-mt-5 text-[22px] font-black tracking-tight text-gray-900">VedaAI</span>
      </div>

      {/* ── Create Assignment ── */}
      <div className="px-4 py-5">
        <Link 
          href="/create" 
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#3A3A3A] to-[#1A1A1A] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_0_2px_#E5442D,0_4px_10px_rgba(229,68,45,0.3)] transition-all hover:scale-[1.02] active:scale-95"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          Create Assignment
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const isActive = active(href);
          const count    = href === '/assignments' ? assignmentCount : 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#FEF3F0] text-[#E5442D]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              <Icon
                className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-[#E5442D]' : 'text-gray-400')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="flex-1 truncate">{label}</span>
              {count > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E5442D] px-1.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="border-t border-gray-100 px-3 py-4 space-y-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-xl px-2 py-1 text-[15px] transition-colors',
            path === '/settings'
              ? 'text-[#E5442D] font-semibold'
              : 'text-gray-500 hover:text-gray-800 font-medium'
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          Settings
        </Link>

        {/* School profile Card */}
        <button 
          onClick={() => setIsProfileOpen(true)}
          className="flex w-full items-center gap-3 rounded-[20px] bg-[#F4F4F5] p-2.5 text-left transition-all hover:bg-gray-200 active:scale-95"
        >
          <div className="h-[42px] w-[42px] flex-shrink-0 overflow-hidden rounded-full bg-[#FCE5D8]">
            {/* School initials logo using Dicebear */}
            <Image 
              src="https://api.dicebear.com/7.x/initials/svg?seed=DPS&backgroundColor=E5442D&textColor=ffffff" 
              alt="DPS" 
              width={42} 
              height={42} 
              className="h-full w-full object-cover" 
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold tracking-tight text-gray-900 leading-tight">{profile?.name || 'Delhi Public School'}</p>
            <p className="truncate text-[13px] text-gray-500 leading-tight mt-0.5">{profile?.address || 'Bokaro Steel City'}</p>
          </div>
        </button>
      </div>

      <SchoolProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onSave={fetchProfile}
      />
    </aside>
  );
}
