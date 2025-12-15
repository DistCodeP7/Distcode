import { SquareTerminal } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthButtons } from "@/components/custom/authButton";
import { AuthAvatar } from "@/components/custom/navbarClientItems";

export async function Navbar() {
  const navLinks = [
    { href: "/docs", label: "Documentation" },
    { href: "/exercises", label: "Exercises" },
    { href: "/authorized", label: "Create New Exercise" },
    { href: "/authorized/diagram", label: "Diagram" },
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
