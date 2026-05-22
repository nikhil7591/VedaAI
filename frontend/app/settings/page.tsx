'use client';

import { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { User, School, Bell, Shield, ChevronRight, Check, Flame } from 'lucide-react';

const SECTIONS = [
  { icon: School, label: 'School Info',   id: 'school'   },
  { icon: Bell,   label: 'Notifications', id: 'notifs'   },
  { icon: Shield, label: 'Security',      id: 'security' },
];

export default function SettingsPage() {
  const [active, setActive] = useState('school');
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({ name: 'John Doe', email: 'john@delhipublicschool.edu', role: 'Teacher', phone: '' });
  const [school, setSchool]   = useState({ name: 'Delhi Public School', city: 'New Delhi', board: 'CBSE', classes: '6–12' });
  const [notifs, setNotifs]   = useState({ email: true, browser: false, weeklyReport: true });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="p-5 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="mt-0.5 text-sm text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Sidebar nav */}
          <div className="w-full md:w-52 flex-shrink-0">
            <div className="card overflow-hidden">
              {SECTIONS.map(({ icon: Icon, label, id }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${active === id ? 'bg-[#FEF3F0] text-[#E5442D]' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${active === id ? 'text-[#E5442D]' : 'text-gray-400'}`} />
                    {label}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="card p-5 md:p-7">

              {active === 'school' && (
                <div>
                  <h2 className="mb-5 text-base font-bold text-gray-900">School Information</h2>
                  <div className="space-y-4">
                    <div><label className="label">School Name</label><input className="input" value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} /></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="label">City</label><input className="input" value={school.city} onChange={(e) => setSchool({ ...school, city: e.target.value })} /></div>
                      <div><label className="label">Board</label>
                        <select className="input" value={school.board} onChange={(e) => setSchool({ ...school, board: e.target.value })}>
                          {['CBSE','ICSE','State Board','IB','IGCSE'].map((b) => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label className="label">Classes Taught</label><input className="input" placeholder="e.g. 6–12" value={school.classes} onChange={(e) => setSchool({ ...school, classes: e.target.value })} /></div>
                  </div>
                </div>
              )}

              {active === 'notifs' && (
                <div>
                  <h2 className="mb-5 text-base font-bold text-gray-900">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'email'       as const, label: 'Email notifications',   desc: 'Get notified via email when papers are generated' },
                      { key: 'browser'     as const, label: 'Browser notifications',  desc: 'Receive push notifications in the browser'         },
                      { key: 'weeklyReport'as const, label: 'Weekly activity report', desc: 'Get a summary of your week every Monday'            },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{label}</p>
                          <p className="mt-0.5 text-xs text-gray-400">{desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifs({ ...notifs, [key]: !notifs[key] })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${notifs[key] ? 'bg-[#E5442D]' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {active === 'security' && (
                <div>
                  <h2 className="mb-5 text-base font-bold text-gray-900">Security</h2>
                  <div className="space-y-4">
                    <div><label className="label">Current Password</label><input className="input" type="password" placeholder="••••••••" /></div>
                    <div><label className="label">New Password</label><input className="input" type="password" placeholder="Min. 8 characters" /></div>
                    <div><label className="label">Confirm New Password</label><input className="input" type="password" placeholder="Repeat new password" /></div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
                      Password must be at least 8 characters and include a number and special character.
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                    <Check className="h-4 w-4" /> Saved!
                  </span>
                )}
                <button onClick={handleSave} className="btn-brand px-6">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
