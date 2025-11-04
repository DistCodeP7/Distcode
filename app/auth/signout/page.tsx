"use client";
import { signOut } from "next-auth/react";

export default function AutoSignOutPage() {
  signOut({ callbackUrl: "/auth/login" });
  return;
}
