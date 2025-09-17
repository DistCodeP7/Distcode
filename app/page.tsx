import Link from "next/link";
import { Braces, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import NeonLines from "@/components/custom/NeonLine";
import { FeedbackStream } from "@/components/custom/feedbackstream";

export default function Home() {
  const features = [
    {
      icon: Mountain,
      title: "Interactive Simulations",
      description:
        "Run distributed algorithms in real-time and visualise the results.",
    },
    {
      icon: Braces,
      title: "Step-by-Step Tutorials",
      description: "Learn each concept gradually with hands-on exercises.",
    },
  ];

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <NeonLines count={160} />
      </div>

      <main className="flex flex-col items-center text-center sm:text-left gap-6 max-w-3xl mx-auto py-16">
        <h1 className="text-5xl font-bold leading-tight">
          Learn Distributed Programming
        </h1>
        <p className="text-muted-foreground text-center text-lg sm:text-xl max-w-lg">
          Build, run, and understand distributed algorithms in a safe and
          interactive environment.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link href="/auth">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </Link>
        </div>

        {/* Features */}
        <section className="flex flex-wrap justify-center gap-6 w-full max-w-5xl">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border bg-card text-center flex flex-col items-center gap-4 hover:shadow-lg transition-shadow w-60"
              >
                <Icon className="w-10 h-10 text-primary" />
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* Example Section */}
        <section className="flex flex-col items-center gap-4 max-w-3xl">
          <h2 className="text-2xl font-semibold">
            Start Experimenting Instantly
          </h2>
          <p className="text-muted-foreground text-center">
            You don’t need to set up anything. Create an account and start
            running algorithms in our interactive sandbox.
          </p>
          <Link href="/auth">
            <Button size="lg">Start Experiment</Button>
          </Link>
        </section>

        {/* SSE Feedback Stream Section */}
        <FeedbackStream />

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row gap-6 items-center justify-center text-sm text-muted-foreground mt-16 w-full">
          <Link href="/docs" className="hover:underline">
            Docs
          </Link>
          <Link
            href="https://github.com"
            target="_blank"
            className="hover:underline"
          >
            GitHub
          </Link>
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <span className="mt-2 sm:mt-0">© 2025 Distcode</span>
        </footer>
      </main>
    </div>
  );
}
