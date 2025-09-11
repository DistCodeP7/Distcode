// app/editor/layout.tsx

import { Navbar } from "@/components/custom/navbar";

export default function EditorLayout({
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
