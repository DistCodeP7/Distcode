import { Braces, Mountain } from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";
import NeonLines from "@/components/custom/neonLine";
import { Button } from "@/components/ui/button";

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
        <NeonLines />
      </div>

      <main className="flex flex-col items-center text-center sm:text-left gap-6 max-w-3xl mx-auto py-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-5xl font-bold leading-tight"
        >
          Learn Distributed Programming
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
          className="text-muted-foreground text-center text-lg sm:text-xl max-w-lg"
        >
          Build, run, and understand distributed algorithms in a safe and
          interactive environment.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 mt-4"
        >
          <Link href="/auth/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </Link>
        </motion.div>

        {/* Features */}
        <section className="flex flex-wrap justify-center gap-6 w-full max-w-5xl">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.2, duration: 0.8 }}
                className="p-6 rounded-2xl border bg-card text-center flex flex-col items-center gap-4 hover:shadow-lg transition-shadow w-60"
              >
                <Icon className="w-10 h-10 text-primary" />
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </section>

        {/* Example Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-col items-center gap-4 max-w-3xl"
        >
          <h2 className="text-2xl font-semibold">
            Start Experimenting Instantly
          </h2>
          <p className="text-muted-foreground text-center">
            You don’t need to set up anything. Create an account and start
            running algorithms in our interactive sandbox.
          </p>
          <Link href="/auth/login">
            <Button size="lg">Start Experiment</Button>
          </Link>
        </motion.section>

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
