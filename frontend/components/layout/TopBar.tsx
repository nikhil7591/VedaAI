'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, ChevronDown, ChevronLeft, ClipboardList, LayoutGrid, Menu, Settings, Sparkles, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import { MobileDrawer } from './MobileDrawer';
import { ProfileAPI } from '../../lib/api';

const LABELS: Record<string, string> = {
  '/':             'Home',
  '/assignments':  'Assignment',
  '/create':       'Create Assignment',
  '/library':      'My Library',
  '/toolkit':      "AI Teacher's Toolkit",
  '/groups':       'My Groups',
  '/settings':     'Settings',
};

function getHeaderIcon(path: string) {
  if (path.startsWith('/assignments')) return LayoutGrid;
  if (path.includes('/paper') || path.includes('/status')) return BookOpen;
  if (path.startsWith('/groups')) return Users;
  if (path.startsWith('/library')) return BookOpen;
  if (path.startsWith('/toolkit')) return Sparkles;
  if (path.startsWith('/settings')) return Settings;
  return LayoutGrid;
}

function getLabel(path: string) {
  if (path.includes('/paper'))  return 'Question Paper';
  if (path.includes('/status')) return 'Generating Paper';
  const key = Object.keys(LABELS)
    .filter((k) => k !== '/')
    .find((k) => path === k || path.startsWith(k + '/'));
  return key ? LABELS[key] : (LABELS[path] ?? 'Page');
}

export function TopBar() {
  const path   = usePathname();
  const router = useRouter();
  const label  = getLabel(path);
  const HeaderIcon = getHeaderIcon(path);

  const canGoBack = path !== '/';
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileName, setProfileName] = useState('John Doe');
  const profileRef = useRef<HTMLDivElement | null>(null);

  const initials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'JD';

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!profileRef.current) return;
      if (e.target instanceof Node && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false);
    }
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    ProfileAPI.get()
      .then((p) => {
        if (mounted && p?.name) setProfileName(p.name);
      })
      .catch(() => {});

    const onProfileUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ name?: string }>;
      if (custom.detail?.name) setProfileName(custom.detail.name);
    };

    window.addEventListener('profile:updated', onProfileUpdated as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('profile:updated', onProfileUpdated as EventListener);
    };
  }, []);

  return (
    <>
      <header className="sticky top-3 z-30 mx-2.5 flex h-[60px] items-center justify-between rounded-[18px] border border-gray-100 bg-white px-4 shadow-[0_2px_10px_rgba(15,23,42,0.06)] md:mx-4 md:h-[60px] md:px-5">
        
        {/* Desktop Left: Title + Back (hidden on mobile) */}
        <div className="hidden flex-1 items-center overflow-hidden pr-2 md:flex">
          {canGoBack && (
            <button
              onClick={() => router.back()}
              className="mr-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
          <div className="flex min-w-0 items-center gap-2.5">
            <HeaderIcon className="h-4 w-4 flex-shrink-0 text-gray-400" strokeWidth={2.25} />
            <span className="truncate text-[15px] font-medium text-[#0A2540]">{label}</span>
          </div>
        </div>

        {/* Mobile Left: Logo (hidden on desktop) */}
        <Link href="/" className="flex items-center gap-2.5 md:hidden">
          <Image src="/logo.png" alt="VedaAI" width={50} height={54} className="mt-[22px] h-[57px] w-[52px] rounded-[10px] object-cover" />
          <span className="-ml-[14px] -mt-[4px] text-[20px] font-bold tracking-tight text-[#1A1A1A]">VedaAI</span>
        </Link>

        {/* Right: notifications + user + hamburger */}
        <div className="flex items-center justify-end gap-3.5 md:gap-3 md:flex-1 relative">
          <NotificationDropdown />

          {/* Mobile Profile & Hamburger */}
          <div className="flex items-center gap-3.5 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E2E8F0] text-[12px] font-bold text-[#0A2540] ring-2 ring-gray-100">
              {initials}
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-8 w-8 items-center justify-center text-gray-900 active:scale-90 transition-transform"
              aria-label="Open menu"
            >
               <Menu className="h-[22px] w-[22px]" strokeWidth={2.5} />
            </button>
          </div>

          {/* Desktop Profile Pill */}
          <div className="relative hidden md:block" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((s) => !s)}
              aria-haspopup="true"
              aria-expanded={profileOpen}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 py-1 pl-1 pr-2 hover:bg-gray-50 transition-colors shadow-sm bg-white"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E2E8F0] text-[11px] font-bold text-[#0A2540] flex-shrink-0">
                {initials}
              </div>
              <span className="hidden text-xs font-semibold text-gray-700 sm:block">{profileName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {profileOpen && <ProfileDropdown onLogout={() => {}} />}
          </div>
        </div>
      </header>

      {/* Mobile Side Drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

