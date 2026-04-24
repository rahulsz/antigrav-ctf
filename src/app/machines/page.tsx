import { getAllMachines } from "@/lib/machines";
import { FloatingNav } from "@/components/floating-nav";
import { CommandConsole } from "@/components/command-console";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Machines",
  description: "Browse all CTF machine walkthroughs — filter by platform, category, and difficulty.",
};

export default function MachinesPage() {
  const machines = getAllMachines();

  return (
    <div className="relative min-h-screen">
      <FloatingNav />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-cyan-glow/50" />
            <span className="text-xs font-mono text-cyan-glow/70 tracking-widest uppercase">
              Target Registry
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ghost tracking-tight">
            Machine Index
          </h1>
          <p className="text-spectral mt-2 text-sm max-w-xl">
            Complete archive of compromised systems. Each entry contains full
            kill-chain documentation from reconnaissance to root.
          </p>
        </div>

        {/* Command Console + Filtered Grid */}
        <Suspense fallback={null}>
          <CommandConsole machines={machines} />
        </Suspense>
      </div>
    </div>
  );
}
