import Link from "next/link";
import { Braces, Mountain, SquareTerminal } from "lucide-react";

import { Button } from "@/components/ui/button";
export function Navbar() {
  const navLinks = [
    { href: "#", label: "Features" },
    { href: "#", label: "Problems" },
  ];

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
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost">Login</Button>
        <Button>Sign Up</Button>
      </div>
    </header>
  );
}
