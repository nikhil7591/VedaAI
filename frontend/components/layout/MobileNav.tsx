'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, BookOpen, Library, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

const TABS = [
  { href: '/',            icon: LayoutGrid, label: 'Home'       },
  { href: '/assignments', icon: BookOpen,   label: 'Assignments' },
  { href: '/library',     icon: Library,    label: 'Library'     },
  { href: '/toolkit',     icon: Sparkles,   label: 'AI Toolkit'  },
];

export function MobileNav() {
  const path = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    if (href === '/assignments') return path === '/assignments';
    return path === href || path.startsWith(href + '/');
  };

  return (
    <nav
      className="fixed bottom-4 inset-x-4 z-50 flex h-[68px] items-center justify-around rounded-[32px] md:hidden shadow-xl"
      style={{ background: '#1A1A1A' }}
    >
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 w-[70px] h-full"
          >
            {/* Active indicator bar */}
            <div className={cn(
              'h-1 w-6 rounded-full transition-all absolute top-2',
              active ? 'bg-white' : 'bg-transparent'
            )} />
            <Icon
              className={cn('h-[22px] w-[22px] mt-1', active ? 'text-white' : 'text-white/40')}
              strokeWidth={active ? 2.5 : 2}
            />
            <span className={cn(
              'text-[10px] font-medium tracking-wide',
              active ? 'text-white' : 'text-white/40'
            )}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
