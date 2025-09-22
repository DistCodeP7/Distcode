import { Navbar } from '@/components/custom/navbar';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
