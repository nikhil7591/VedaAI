'use client';

import { X, MapPin, Mail, Phone, Globe, Camera } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ProfileAPI } from '../../lib/api';

interface SchoolProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function SchoolProfileModal({ isOpen, onClose, onSave }: SchoolProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    website: ''
  });

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      ProfileAPI.get()
        .then((profile) => {
          if (profile) {
            setData({
              name: profile.name || '',
              address: profile.address || '',
              email: profile.email || '',
              phone: profile.phone || '',
              website: profile.website || ''
            });
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      await ProfileAPI.update(data);
      setIsEditing(false);
      if (onSave) onSave();
    } catch (err) {
      alert('Failed to save profile');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Cover Image & Avatar */}
        <div className="relative h-32 bg-gradient-to-r from-[#FEF3F0] to-[#FCE5D8]">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/50 text-gray-700 backdrop-blur hover:bg-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute -bottom-10 left-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-[#FCE5D8] shadow-sm group">
              <Image 
                src="https://api.dicebear.com/7.x/initials/svg?seed=DPS&backgroundColor=E5442D&textColor=ffffff" 
                alt="School Avatar" 
                width={96} 
                height={96} 
                className="h-full w-full object-cover"
                unoptimized
              />
              {isEditing && (
                <button className="absolute inset-0 bg-black/40 flex items-center justify-center text-white backdrop-blur-[2px]">
                  <Camera className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-8 pt-14">
          {!isEditing ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900">{data.name || 'School Name'}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                {data.address || 'Address not set'}
              </p>

              <div className="mt-6 space-y-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Contact Details</h3>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{data.email}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{data.phone}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a href="#" className="text-[#E5442D] hover:underline">{data.website}</a>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setIsEditing(true)} className="btn-brand flex-1 py-2.5">Edit Profile</button>
                <button className="btn-ghost py-2.5 px-6" onClick={() => { setIsEditing(false); onClose(); }}>Close</button>
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className="label text-xs">School Name</label>
                <input className="input py-2" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
              </div>
              <div>
                <label className="label text-xs">Address</label>
                <input className="input py-2" value={data.address} onChange={e => setData({...data, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Email</label>
                  <input className="input py-2" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
                </div>
                <div>
                  <label className="label text-xs">Phone</label>
                  <input className="input py-2" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label text-xs">Website</label>
                <input className="input py-2" value={data.website} onChange={e => setData({...data, website: e.target.value})} />
              </div>

              <div className="mt-6 flex gap-3 pt-2">
                <button className="btn-ghost flex-1 py-2.5" onClick={() => setIsEditing(false)}>Cancel</button>
                <button className="btn-brand flex-1 py-2.5" onClick={handleSave}>Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
