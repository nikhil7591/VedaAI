'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, CheckCircle, Clock,
  Loader2, TrendingUp, BookOpen, Sparkles,
  ArrowRight, XCircle, Users, Library,
  CalendarDays
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { AssignmentAPI, GroupAPI, ProfileAPI } from '../lib/api';
import { Assignment } from '../types';
import { cn } from '../lib/utils';

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:    { label: 'Queued',     cls: 'bg-gray-100 text-gray-500',   icon: Clock         },
  processing: { label: 'Processing', cls: 'bg-blue-50 text-blue-600',    icon: Loader2       },
  completed:  { label: 'Done',       cls: 'bg-green-50 text-green-700',  icon: CheckCircle   },
  failed:     { label: 'Failed',     cls: 'bg-red-50 text-red-500',      icon: XCircle       },
};

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="card flex items-center gap-4 p-5 transition-transform hover:scale-[1.02]">
      <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, desc, href, color }: {
  icon: React.ElementType; title: string; desc: string; href: string; color: string;
}) {
  return (
    <Link href={href} className="card group flex items-center gap-4 p-4 transition-all hover:shadow-md hover:scale-[1.01]">
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-[#E5442D] transition-colors" />
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [profile, setProfile] = useState<{name: string} | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      AssignmentAPI.list(1, 50).catch(() => ({ assignments: [] })),
      GroupAPI.list().catch(() => []),
      ProfileAPI.get().catch(() => null)
    ]).then(([assignRes, groupsRes, profileRes]) => {
      setAssignments(assignRes.assignments || []);
      setGroups(groupsRes || []);
      setProfile(profileRes || { name: 'Teacher' });
      setLoading(false);
    });
  }, []);

  const isEmpty = !loading && assignments.length === 0;
  const completed  = assignments.filter((a) => a.status === 'completed').length;
  const processing = assignments.filter((a) => a.status === 'processing' || a.status === 'pending').length;
  const recent     = assignments.slice(0, 5);
  
  const now = new Date();
  const upcomingDeadlines = assignments
    .filter(a => new Date(a.dueDate) > now && a.status !== 'failed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const activeGroups = groups.slice(0, 4);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <AppShell assignmentCount={assignments.length}>
      {loading ? (
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#E5442D]" />
        </div>
      ) : isEmpty ? (
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 w-56 select-none animate-fade-in">
            <Image
              src="/illustrations.png"
              alt="No assignments yet"
              width={280} height={260}
              priority className="w-full drop-shadow-sm"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to VedaAI</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
            Create your first assignment or add a group to start managing your classes efficiently with AI.
          </p>
          <div className="flex gap-4 mt-8">
            <Link href="/create" className="btn-dark px-7 py-3 shadow-lg shadow-black/10">
              <Plus className="h-4 w-4" />
              Create Assignment
            </Link>
            <Link href="/groups" className="btn-ghost px-7 py-3 shadow-lg shadow-black/5">
              <Users className="h-4 w-4" />
              Add Group
            </Link>
          </div>
          <Link href="/create" aria-label="Create"
            className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#E5442D] to-[#D0301A] text-white shadow-xl md:hidden">
            <Plus className="h-6 w-6" />
          </Link>
        </div>
      ) : (
        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
          {/* Welcome & Quick Actions Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-[#E5442D] tracking-wide uppercase mb-1">Overview</p>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back, {profile?.name?.split(' ')[0] || 'Teacher'} 👋</h1>
              <p className="mt-2 text-[15px] text-gray-500">
                Here&apos;s what&apos;s happening with your assignments and groups today.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/create" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#3A3A3A] to-[#1A1A1A] px-5 py-2.5 text-[13px] font-semibold text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all">
                <Sparkles className="h-4 w-4" /> New Assignment
              </Link>
              <Link href="/groups" className="flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-[13px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                <Users className="h-4 w-4 text-gray-500" /> New Group
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column (Left) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Assignments" value={assignments.length} icon={FileText}    color="bg-gradient-to-br from-[#E5442D] to-[#D0301A]"  />
                <StatCard label="Active Groups" value={groups.length} icon={Users}        color="bg-gradient-to-br from-indigo-500 to-indigo-600"  />
                <StatCard label="Papers Generated" value={completed}   icon={BookOpen}     color="bg-gradient-to-br from-emerald-500 to-emerald-600"  />
                <StatCard label="Processing"  value={processing}        icon={TrendingUp}   color="bg-gradient-to-br from-blue-500 to-blue-600"   />
              </div>

              {/* Recent Assignments */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Assignments</h2>
                  <Link href="/assignments" className="text-sm font-semibold text-[#E5442D] hover:underline flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="card overflow-hidden border border-gray-100 shadow-sm">
                  {recent.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center">
                      <div className="bg-gray-50 p-4 rounded-full mb-3"><FileText className="h-6 w-6 text-gray-400" /></div>
                      <p className="text-[15px] font-medium text-gray-900">No assignments found</p>
                      <p className="text-sm text-gray-500 mt-1">Generate your first AI paper to see it here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50/80">
                      {recent.map((a) => {
                        const cfg = STATUS_STYLES[a.status] ?? STATUS_STYLES.pending;
                        const Icon = cfg.icon;
                        const href = a.status === 'completed'
                          ? `/assignments/${a._id}/paper`
                          : `/assignments/${a._id}/status`;
                        return (
                          <div
                            key={a._id}
                            onClick={() => router.push(href)}
                            className="group flex cursor-pointer items-center gap-4 px-6 py-4 hover:bg-[#FDFDFD] transition-all"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-[#FEF3F0] group-hover:border-[#FCE5D8] transition-colors">
                              <FileText className="h-5 w-5 text-gray-400 group-hover:text-[#E5442D] transition-colors" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-bold text-gray-900">{a.title}</p>
                              <div className="mt-1 flex items-center gap-2 text-[13px] text-gray-500">
                                <span className="font-medium text-gray-700">{a.subject}</span>
                                <span>•</span>
                                <span>Created {fmt(a.createdAt)}</span>
                              </div>
                            </div>
                            <span className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
                              cfg.cls
                            )}>
                              <Icon className={cn('h-3.5 w-3.5', a.status === 'processing' && 'animate-spin')} />
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Tools */}
              <div>
                <h2 className="mb-4 text-lg font-bold text-gray-900 tracking-tight">Toolkit & Library</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ActionCard icon={Sparkles} title="AI Teacher's Toolkit" desc="Generate rubrics & content" href="/toolkit" color="bg-gradient-to-br from-fuchsia-500 to-purple-600" />
                  <ActionCard icon={Library} title="My Library" desc="Browse saved questions & papers" href="/library" color="bg-gradient-to-br from-amber-400 to-orange-500" />
                </div>
              </div>

            </div>

            {/* Side Content Column (Right) */}
            <div className="space-y-8">
              
              {/* Upcoming Deadlines */}
              <div className="card p-6 border border-gray-100 shadow-sm bg-[#FAFAFA]">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarDays className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Upcoming Deadlines</h2>
                </div>
                
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-[14px] text-gray-500 py-4 text-center bg-white rounded-xl border border-dashed border-gray-200">No upcoming deadlines.</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((a) => (
                      <div key={a._id} onClick={() => router.push(`/assignments/${a._id}/paper`)} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all flex items-start gap-3">
                        <div className="bg-indigo-50 text-indigo-600 font-bold text-xs uppercase px-2 py-1 rounded-lg text-center min-w-[48px]">
                          <div className="text-[10px] opacity-70">{new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                          <div className="text-[16px] leading-none mt-0.5">{new Date(a.dueDate).getDate()}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-gray-900 truncate">{a.title}</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">{a.subject}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Active Groups */}
              <div className="card p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Active Groups</h2>
                  </div>
                  <Link href="/groups" className="text-xs font-bold text-[#E5442D] hover:underline">See all</Link>
                </div>
                
                {activeGroups.length === 0 ? (
                  <p className="text-[14px] text-gray-500 py-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">No active groups yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activeGroups.map((g) => (
                      <Link key={g._id} href={`/groups`} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: g.color || '#3B82F6' }}>
                          {g.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-gray-900 truncate">{g.name}</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">{g.subject}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
