import Link from "next/link";
import { SquareTerminal } from "lucide-react";
import { AuthButtons } from "@/components/custom/authbutton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import LogoutMenuItem from "./logout-menu-item";

export async function Navbar() {
  const navLinks = [
    { href: "#", label: "Features" },
    { href: "#", label: "Problems" },
  ];

  const session = await getServerSession(authOptions);
  console.log("Session in Navbar:", session);

  return (
    <header className="sticky top-0 z-50 flex items-center gap-4 border-b bg-background/80 px-4 py-4 backdrop-blur-sm md:px-6">
      <Link href="/" className="mr-4 hidden items-center gap-2 md:flex">
        <SquareTerminal />
        <span className="font-bold">Distcode</span>
      </Link>

      <nav className="hidden flex-1 items-center gap-6 text-sm font-medium md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {session?.user?.email ? (
        <AuthAvatar userInitials={session.user.email.charAt(0).toUpperCase()} />
      ) : (
        <AuthButtons />
      )}
    </header>
  );
}

const AuthAvatar = ({ userInitials }: { userInitials: string }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <LogoutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
