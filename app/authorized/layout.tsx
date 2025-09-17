'use client';

import { AuthProvider } from '@/components/custom/auth-provider';
import { SessionProvider } from 'next-auth/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <SessionProvider>
        <AuthProvider>{children}</AuthProvider>
      </SessionProvider>
    </div>
  );
}
