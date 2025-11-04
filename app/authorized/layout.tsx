import { Navbar } from "@/components/custom/navbar";
import SessionProviderClient from "@/components/custom/session-provider-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex h-screen flex-col">
      <SessionProviderClient session={session}>
        <Navbar />
        <main className="flex-1 min-h-0">{children}</main>
      </SessionProviderClient>
    </div>
  );
}
