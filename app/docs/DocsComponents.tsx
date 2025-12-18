"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scrollArea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

// Shared data structure
export const DOC_SECTIONS = [
  { id: "intro", title: "Introduction" },
  { id: "communication-protocol", title: "Communication Protocol" },
  { id: "testing-harness", title: "Testing Harness" },
  { id: "user-submission", title: "User Submission" },
  { id: "full-example", title: "Full Example: Echo Broadcast" },
  { id: "full-protocol", title: "Example Protocol" },
  { id: "full-harness", title: "Example Harness" },
  { id: "full-impl", title: "Example Implementation" },
];

export function DocsNavigation() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const NavButtons = () => (
    <div className="flex flex-col gap-2">
      {DOC_SECTIONS.map((section) => (
        <Button
          key={section.id}
          variant="ghost"
          className="justify-start h-auto py-2 px-2 text-sm font-normal text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
          onClick={() => scrollToSection(section.id)}
        >
          {section.title}
        </Button>
      ))}
    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:col-span-3 lg:block sticky top-6 h-[calc(100vh-100px)]">
        <Card className="h-full border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg">Contents</CardTitle>
            <CardDescription>Navigate the exercises</CardDescription>
          </CardHeader>
          <ScrollArea className="h-full pr-4">
            <NavButtons />
          </ScrollArea>
        </Card>
      </aside>

      {/* MOBILE MENU */}
      <div className="lg:hidden mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Menu className="h-4 w-4" /> Table of Contents
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <div className="mt-4 flex flex-col gap-2">
              <h3 className="text-lg font-semibold mb-2">Jump to Section</h3>
              <NavButtons />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
