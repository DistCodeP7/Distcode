"use client";
import { signOut } from "next-auth/react";

export default function LoginPage() {
  signOut({ callbackUrl: "/auth/login" });
  return;
}
