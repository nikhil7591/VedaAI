'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/layout/AppShell';
import { Users, Plus, MoreVertical, BookOpen, UserCheck, Search, Edit2, Trash2 } from 'lucide-react';
import { GroupAPI } from '../../lib/api';

interface Group { _id: string; name: string; subject: string; students: number; papers?: number; color: string; }

export default function GroupsPage() {
  const [search, setSearch]       = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [showEdit, setShowEdit]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName]     = useState('');
  const [newSubj, setNewSubj]     = useState('');
  const [menuOpen, setMenuOpen]   = useState<string | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await GroupAPI.list();
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = groups.filter(
    (g) => g.name.toLowerCase().includes(search.toLowerCase()) ||
           g.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim() || !newSubj.trim()) return;
    try {
      await GroupAPI.create({ name: newName.trim(), subject: newSubj.trim(), color: '#E5442D' });
      await fetchGroups();
      setNewName(''); setNewSubj(''); setShowNew(false);
    } catch (err) {
      alert('Failed to create group');
    }
  };

  const handleEdit = async () => {
    if (!newName.trim() || !newSubj.trim() || !editingId) return;
    try {
      await GroupAPI.update(editingId, { name: newName.trim(), subject: newSubj.trim() });
      await fetchGroups();
      setNewName(''); setNewSubj(''); setEditingId(null); setShowEdit(false); setMenuOpen(null);
    } catch (err) {
      alert('Failed to update group');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      try {
        await GroupAPI.delete(id);
        await fetchGroups();
        setMenuOpen(null);
      } catch (err) {
        alert('Failed to delete group');
      }
    }
  };

  const openEditModal = (g: Group) => {
    setNewName(g.name);
    setNewSubj(g.subject);
    setEditingId(g._id);
    setShowEdit(true);
    setMenuOpen(null);
  };

  return (
    <AppShell>
      <div className="p-5 md:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Groups</h1>
            <p className="mt-0.5 text-sm text-gray-400">Manage your student groups and classes</p>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-brand"><Plus className="h-4 w-4" /> New Group</button>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>

        {showNew && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-sm p-6 animate-in zoom-in-95">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Create New Group</h2>
              <div className="space-y-4">
                <div><label className="label">Group Name *</label><input className="input" placeholder="e.g. Class 10 - A" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                <div><label className="label">Subject *</label><input className="input" placeholder="e.g. Physics" value={newSubj} onChange={(e) => setNewSubj(e.target.value)} /></div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => { setShowNew(false); setNewName(''); setNewSubj(''); }} className="btn-ghost flex-1 py-2.5">Cancel</button>
                <button onClick={handleCreate} className="btn-brand flex-1 py-2.5">Create</button>
              </div>
            </div>
          </div>
        )}

        {showEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-sm p-6 animate-in zoom-in-95">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Edit Group</h2>
              <div className="space-y-4">
                <div><label className="label">Group Name *</label><input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                <div><label className="label">Subject *</label><input className="input" value={newSubj} onChange={(e) => setNewSubj(e.target.value)} /></div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => { setShowEdit(false); setNewName(''); setNewSubj(''); }} className="btn-ghost flex-1 py-2.5">Cancel</button>
                <button onClick={handleEdit} className="btn-brand flex-1 py-2.5">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100"><Users className="h-7 w-7 text-gray-300" /></div>
            <p className="font-semibold text-gray-700">No groups found</p>
            <p className="mt-1 text-sm text-gray-400">Create your first student group to get started.</p>
            <button onClick={() => setShowNew(true)} className="btn-brand mt-5"><Plus className="h-4 w-4" /> Create Group</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g) => (
              <div key={g._id} className="card p-5 border border-gray-100 rounded-2xl bg-white transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-start justify-between relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: g.color }}>
                    <Users className="h-7 w-7" />
                  </div>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === g._id ? null : g._id)} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    {menuOpen === g._id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-9 z-50 w-36 rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button onClick={() => openEditModal(g)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <div className="border-t border-gray-100" />
                          <button onClick={() => handleDelete(g._id)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{g.name}</h3>
                <p className="mt-1 text-sm font-medium text-gray-500">{g.subject}</p>
                <div className="mt-5 flex items-center gap-4 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><UserCheck className="h-4 w-4 text-gray-400" /> {g.students || 0} Students</span>
                  <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-gray-400" /> {g.papers || 0} Papers</span>
                </div>
                <Link href={`/groups/${g._id}`} className="mt-6 flex w-full items-center justify-center rounded-xl bg-gray-100/80 py-3 text-sm font-bold text-gray-900 hover:bg-gray-200 transition-colors">
                  View Group
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
