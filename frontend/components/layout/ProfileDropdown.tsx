'use client';

import Link from 'next/link';

export default function ProfileDropdown({ onLogout }: { onLogout?: () => void }) {
  return (
    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
      <div className="py-2">
        <Link href="/profile" className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">Profile</Link>
        <Link href="/settings" className="block w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50">Settings</Link>
        <div className="my-1 border-t border-gray-100" />
        <button onClick={onLogout} className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-gray-50">Log out</button>
      </div>
    </div>
  );
}
