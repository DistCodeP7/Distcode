import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthButtons } from "@/components/custom/authbutton";
import { SquareTerminal } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { AuthAvatar } from "./navbar-client-items";

export async function Navbar() {
  const navLinks = [
    { href: "#", label: "Features" },
    { href: "/exercises", label: "Exercises" },
    { href: "/authorized", label: "Create Problem" },
  ];

  const session = await getServerSession(authOptions);

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
      {session?.user?.image ? (
        <AuthAvatar userAvatar={session.user.image} />
      ) : session?.user?.email ? (
        <AuthAvatar userAvatar={session.user.email.charAt(0).toUpperCase()} />
      ) : (
        <AuthButtons />
      )}
    </header>
  );
}
