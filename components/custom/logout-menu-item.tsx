"use client";

import { signOut } from "next-auth/react";
import { DropdownMenuItem, DropdownMenuShortcut } from "../ui/dropdown-menu";

export default function LogoutMenuItem() {
  return (
    <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
      Log out
      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
    </DropdownMenuItem>
  );
}
