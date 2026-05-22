'use client';

import { useEffect, useState, use } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { Plus, Users, BookOpen, MoreVertical, Search, Edit2, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AssignmentAPI, GroupAPI, StudentAPI } from '../../../lib/api';
import { Assignment } from '../../../types';
import { AssignmentCard } from '../../../components/cards/AssignmentCard';

interface Student { _id: string; name: string; rollNo: string; email: string; }
interface Group { _id: string; name: string; subject: string; students: number; color: string; }

const MOCK_STUDENTS = Array.from({ length: 32 }).map((_, i) => ({
  id: `mock-${i}`,
  name: `Student ${i + 1}`,
  rollNo: `${101 + i}`,
  email: `student${i + 1}@example.com`
}));

export default function GroupDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { id } = params;

  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'students' | 'papers'>('students');
  const [search, setSearch] = useState('');
  
  const [groupAssignments, setGroupAssignments] = useState<Assignment[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(true);

  // Fetch initial group and students data
  useEffect(() => {
    Promise.all([
      GroupAPI.getById(id),
      StudentAPI.listByGroup(id)
    ])
    .then(([g, s]) => {
      setGroup(g);
      setStudents(s);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [id]);

  // Fetch papers for this group
  useEffect(() => {
    if (activeTab === 'papers') {
      setLoadingPapers(true);
      // Now the backend filters by groupId directly!
      AssignmentAPI.list(1, 100)
        .then((res) => {
          // Fallback manual filter if backend doesn't support groupId properly
          // but since we updated the backend, we can just pass params if we wanted.
          // Since our api.ts list() method doesn't accept groupId yet, we filter here 
          // or we can just fetch all and filter by groupId:
          const filtered = res.assignments.filter(a => a.groupId === id);
          setGroupAssignments(filtered);
        })
        .catch(console.error)
        .finally(() => setLoadingPapers(false));
    }
  }, [activeTab, id]);

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Delete this assignment? This cannot be undone.')) return;
    try {
      await AssignmentAPI.delete(paperId);
      setGroupAssignments(prev => prev.filter(a => a._id !== paperId));
    } catch {
      alert('Failed to delete assignment.');
    }
  };
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [email, setEmail] = useState('');
  
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  if (!group) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center">
          <h1 className="text-xl font-bold">Group not found</h1>
          <Link href="/groups" className="mt-4 text-[#E5442D] hover:underline">← Back to Groups</Link>
        </div>
      </AppShell>
    );
  }

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setName(''); setRollNo(''); setEmail('');
    setEditingId(null); setShowModal(true); setMenuOpen(null);
  };

  const openEdit = (s: Student) => {
    setName(s.name); setRollNo(s.rollNo); setEmail(s.email);
    setEditingId(s._id); setShowModal(true); setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !rollNo.trim()) return;
    
    try {
      if (editingId) {
        await StudentAPI.update(editingId, { name, rollNo, email });
      } else {
        await StudentAPI.create(id, { name, rollNo, email });
      }
      
      // Refresh students
      const updatedStudents = await StudentAPI.listByGroup(id);
      setStudents(updatedStudents);
      setShowModal(false);
    } catch (err) {
      alert('Failed to save student');
    }
  };

  const handleDelete = async (sId: string) => {
    if (confirm('Remove student from this group?')) {
      try {
        await StudentAPI.delete(sId);
        setStudents(p => p.filter(s => s._id !== sId));
        setMenuOpen(null);
      } catch (err) {
        alert('Failed to delete student');
      }
    }
  };

  return (
    <AppShell>
      {/* Header Banner */}
      <div className="h-32 w-full" style={{ background: group.color || '#3B82F6' }} />
      
      <div className="px-5 md:px-8 pb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div className="flex items-end gap-5">
            <div className="-mt-10 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
              <Users className="h-10 w-10" style={{ color: group.color || '#3B82F6' }} />
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{group.name}</h1>
              <p className="text-sm font-medium text-gray-500 mt-1">{group.subject}</p>
            </div>
          </div>
          <Link href="/groups" className="btn-ghost border border-gray-200 py-2 text-sm mt-2 md:mt-4 bg-white hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Groups
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-100 mb-6">
          <button 
            onClick={() => setActiveTab('students')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'students' ? 'border-[#E5442D] text-[#E5442D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Students ({students.length})
          </button>
          <button 
            onClick={() => setActiveTab('papers')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'papers' ? 'border-[#E5442D] text-[#E5442D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Question Papers
          </button>
        </div>

        {activeTab === 'students' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
              </div>
              <button onClick={openAdd} className="btn-brand">
                <Plus className="h-4 w-4 mr-1.5" /> Add Student
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="flex min-h-[30vh] flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <Users className="h-8 w-8 text-gray-300 mb-3" />
                <p className="font-semibold text-gray-600">No students found</p>
                <p className="text-sm text-gray-400 mt-1">Add students to start tracking their performance.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-4 border-b border-gray-50 bg-gray-50/50 p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5 md:col-span-4">Student Name</div>
                  <div className="col-span-4 md:col-span-3">Roll No</div>
                  <div className="hidden md:block md:col-span-4">Email</div>
                  <div className="col-span-3 md:col-span-1 text-right">Actions</div>
                </div>
                <div className="divide-y divide-gray-50">
                  {filtered.map(s => (
                    <div key={s._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors">
                      <div className="col-span-5 md:col-span-4 font-semibold text-gray-900">{s.name}</div>
                      <div className="col-span-4 md:col-span-3 text-gray-500 text-sm">{s.rollNo}</div>
                      <div className="hidden md:block md:col-span-4 text-gray-500 text-sm">{s.email || '-'}</div>
                      <div className="col-span-3 md:col-span-1 flex justify-end relative">
                        <button onClick={() => setMenuOpen(menuOpen === s._id ? null : s._id)} className="p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpen === s._id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-10 z-50 w-36 rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                              <button onClick={() => openEdit(s)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <div className="border-t border-gray-100" />
                              <button onClick={() => handleDelete(s._id)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'papers' && (
          <div className="flex flex-col gap-6">
            {loadingPapers ? (
              <div className="flex min-h-[30vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
              </div>
            ) : groupAssignments.length === 0 ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-6">
                <BookOpen className="h-10 w-10 text-gray-300 mb-4" />
                <p className="font-semibold text-gray-800 text-lg">No papers assigned yet</p>
                <p className="text-sm text-gray-500 mt-2 max-w-md">Generate your first question paper with AI and assign it directly to this group.</p>
                <Link href={`/create?groupId=${id}`} className="btn-brand mt-6 px-6 py-2.5">
                  <Plus className="h-4 w-4 mr-1.5" /> Create Assignment
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Assigned Papers</h3>
                  <Link href={`/create?groupId=${id}`} className="btn-brand px-4 py-2 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> New Paper
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupAssignments.map(a => (
                    <AssignmentCard key={a._id} a={a} onDelete={handleDeletePaper} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 animate-in zoom-in-95">
            <h2 className="mb-4 text-lg font-bold text-gray-900">{editingId ? 'Edit Student' : 'Add Student'}</h2>
            <div className="space-y-4">
              <div><label className="label">Full Name *</label><input className="input" placeholder="e.g. Rahul Kumar" value={name} onChange={e => setName(e.target.value)} /></div>
              <div><label className="label">Roll Number *</label><input className="input" placeholder="e.g. 101" value={rollNo} onChange={e => setRollNo(e.target.value)} /></div>
              <div><label className="label">Email Address</label><input className="input" placeholder="Optional" value={email} onChange={e => setEmail(e.target.value)} /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1 py-2.5">Cancel</button>
              <button onClick={handleSave} className="btn-brand flex-1 py-2.5">{editingId ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
