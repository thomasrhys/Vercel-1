// components/FriendProvider.tsx
'use client';

import { FriendNotificationBell } from './FriendNotificationBell';
import { ReactNode } from 'react';

export default function FriendProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <FriendNotificationBell />
    </>
  );
}
