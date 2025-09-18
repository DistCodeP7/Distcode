"use client";

import { SessionProvider } from "next-auth/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <SessionProvider>{children}</SessionProvider>
    </div>
  );
}
