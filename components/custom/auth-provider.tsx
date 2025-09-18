"use client";

import React, { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation"; // Use 'next/navigation' for Next.js 13+ App Router

interface UserPayload {
  email: string;
  exp: number; // Expiration time in seconds
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "authenticated" && session?.token) {
    const token = session.token;
    try {
      const decoded = jwtDecode<UserPayload>(token);

      if (decoded.exp * 1000 < Date.now()) {
        signOut({ redirect: false, callbackUrl: "/auth/login" });
      }
    } catch (error) {
      signOut({ redirect: false, callbackUrl: "/auth/login" });
    }
  }

  return <main className="flex-1 flex flex-col">{children}</main>;
};
