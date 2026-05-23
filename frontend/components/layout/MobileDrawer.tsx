'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  X, Users, Settings, LogOut,
  ChevronRight, Sparkles, MapPin,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProfileAPI } from '../../lib/api';

const DRAWER_NAV = [
  { href: '/groups',   icon: Users,    label: 'My Groups'  },
  { href: '/settings', icon: Settings, label: 'Settings'    },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const path = usePathname();
  const [profile, setProfile] = useState<{ name: string; address: string } | null>(null);

  // Fetch profile once when drawer opens
  useEffect(() => {
    if (isOpen) {
      ProfileAPI.get()
        .then((p: any) => {
          if (p) setProfile({ name: p.name, address: p.address });
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (href: string) => path === href || path.startsWith(href + '/');

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-[70] flex h-full w-[280px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="VedaAI" width={40} height={40} className="rounded-lg" priority />
            <span className="text-[18px] font-bold tracking-tight text-gray-900">VedaAI</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-90 transition-all"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Create Assignment CTA */}
        <div className="px-4 pt-5 pb-2">
          <Link
            href="/create"
            onClick={onClose}
            className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-[#3A3A3A] to-[#1A1A1A] px-4 py-3.5 text-[14px] font-semibold text-white shadow-[0_0_0_2px_#E5442D,0_4px_10px_rgba(229,68,45,0.25)] transition-all hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            Create Assignment
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {DRAWER_NAV.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[15px] font-medium transition-all',
                  active
                    ? 'bg-[#FEF3F0] text-[#E5442D] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon
                  className={cn('h-5 w-5 flex-shrink-0', active ? 'text-[#E5442D]' : 'text-gray-400')}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="flex-1">{label}</span>
                <ChevronRight className={cn('h-4 w-4', active ? 'text-[#E5442D]/50' : 'text-gray-300')} />
              </Link>
            );
          })}
        </nav>

        {/* Bottom: School Profile Card */}
        <div className="mt-auto border-t border-gray-100 px-4 py-4 space-y-3">
          {/* School Card */}
          <div className="flex items-center gap-3 rounded-2xl bg-[#F4F4F5] p-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#E5442D] to-[#C53922] text-[12px] font-black text-white shadow-[0_8px_18px_rgba(229,68,45,0.24)]">
              DPS
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-gray-900 leading-tight">
                {profile?.name || 'Delhi Public School'}
              </p>
              <p className="truncate text-[12px] text-gray-500 leading-tight mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {profile?.address || 'Bokaro Steel City'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-medium text-red-500 hover:bg-red-50 transition-colors"
            onClick={() => {
              onClose();
              // TODO: Implement logout logic
            }}
          >
            <LogOut className="h-5 w-5" />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}
