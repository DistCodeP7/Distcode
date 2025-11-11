"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { signOut } from "next-auth/react";
import useShortcut from "@/hooks/useShortcut";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const AuthAvatar = ({ userAvatar }: { userAvatar: string }) => {
  const profileShortcut = useShortcut({
    callback: () => alert("Opening profile..."),
    shortCutOS: {
      Windows: "⇧+Ctrl+U",
      MacOS: "⇧⌘U",
      Linux: "⇧+Ctrl+U",
    },
  });

  const logoutShortcut = useShortcut({
    callback: () => signOut({ callbackUrl: "/" }),
    shortCutOS: {
      Windows: "⇧+Ctrl+L",
      MacOS: "⇧⌘L",
      Linux: "⇧+Ctrl+L",
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer text-xl hover:opacity-80 transition-opacity rounded-full">
          {userAvatar.length > 1 ? (
            <AvatarImage src={userAvatar} className="w-8 rounded-full" />
          ) : (
            <AvatarFallback className="rounded-full">
              {userAvatar}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>{profileShortcut}</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          Log out
          <DropdownMenuShortcut>{logoutShortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
