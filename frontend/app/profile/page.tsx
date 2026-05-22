'use client';

import { AppShell } from '../../components/layout/AppShell';
import { User, Mail, Phone, Shield, Camera } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
    role: 'Senior Teacher',
    bio: 'Passionate educator with 10+ years of experience in making learning fun and engaging.',
  });

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <AppShell>
      <div className="p-5 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your personal information and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Quick Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="card p-6 text-center">
              <div className="relative mx-auto mb-4 h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                <span className="text-3xl font-bold text-gray-400">JD</span>
                {isEditing && (
                  <button className="absolute inset-0 bg-black/40 flex items-center justify-center text-white backdrop-blur-[2px] transition-colors hover:bg-black/50">
                    <Camera className="h-6 w-6" />
                  </button>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
              <p className="text-sm font-medium text-[#E5442D] mt-1">{profile.role}</p>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Account Security</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg text-green-600"><Shield className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">2FA Enabled</p>
                    <p className="text-xs text-gray-400">Your account is secure</p>
                  </div>
                </div>
                <button className="w-full btn-ghost py-2 text-sm font-medium">Change Password</button>
              </div>
            </div>
          </div>

          {/* Right Column - Details Form */}
          <div className="md:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="btn-brand py-1.5 px-4 text-sm rounded-lg">
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input 
                      className="input" 
                      value={profile.firstName} 
                      disabled={!isEditing}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input 
                      className="input" 
                      value={profile.lastName} 
                      disabled={!isEditing}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      className="input pl-10" 
                      type="email"
                      value={profile.email} 
                      disabled={!isEditing}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      className="input pl-10" 
                      type="tel"
                      value={profile.phone} 
                      disabled={!isEditing}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Bio</label>
                  <textarea 
                    className="input min-h-[100px] resize-none py-3" 
                    value={profile.bio} 
                    disabled={!isEditing}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })} 
                  />
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                    <button onClick={() => setIsEditing(false)} className="btn-ghost px-5 py-2.5">Cancel</button>
                    <button onClick={handleSave} className="btn-brand px-6 py-2.5">Save Changes</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
