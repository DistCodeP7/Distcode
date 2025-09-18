"use client";

import React, { useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useSession } from "next-auth/react";

interface UserPayload {
  email: string;
  exp: number;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session } = useSession();

  useEffect(() => {
    const initializeAuth = () => {
      if (session?.token) {
        const token = session.token;
        try {
          const decoded = jwtDecode<UserPayload>(token);
          if (decoded.exp * 1000 > Date.now()) {
            localStorage.setItem("token", token);
          } else {
            localStorage.removeItem("token");
            window.location.href = "/auth/login";
          }
        } catch (error) {
          console.error("AuthProvider: Invalid token from session", error);
          localStorage.removeItem("token");
          window.location.href = "/auth/login";
        }
        return;
      } else {
        const localToken = localStorage.getItem("token");
        if (localToken) {
          try {
            const decoded = jwtDecode<UserPayload>(localToken);
            if (decoded.exp * 1000 < Date.now()) {
              console.log("AuthProvider: Token from localStorage expired.");
              localStorage.removeItem("token");
              window.location.href = "/auth/login";
            } else {
              console.log("AuthProvider: Valid token found in localStorage.");
            }
          } catch (error) {
            console.error("AuthProvider: Invalid token in localStorage", error);
            localStorage.removeItem("token");
            window.location.href = "/auth/login";
          }
        }
        return;
      }
    };

    initializeAuth();
  }, [session]);

  return <main className="flex-1 flex flex-col">{children}</main>;
};
