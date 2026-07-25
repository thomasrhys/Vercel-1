// components/FriendProvider.tsx - UPDATED
'use client';

import { FriendNotificationBell } from '../components/FriendNotificationBell'; // ← Changed to relative
import { ReactNode } from 'react';

export default function FriendProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50">
        <FriendNotificationBell />
      </div>
    </>
  );
}
