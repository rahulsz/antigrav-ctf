import { getAllMachines } from "@/lib/machines";
import { FloatingNav } from "@/components/floating-nav";
import { MachinesGrid } from "@/components/machines-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Machines",
  description: "Browse all CTF machine walkthroughs — sorted by difficulty and date.",
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

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-8 py-3 px-5 glass rounded-lg w-fit">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-spectral/50">TOTAL:</span>
            <span className="text-sm font-mono font-bold text-ghost">{machines.length}</span>
          </div>
          <div className="w-px h-4 bg-glass-border" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-spectral/50">EASY:</span>
            <span className="text-sm font-mono text-success">
              {machines.filter((m) => m.difficulty === "Easy").length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-spectral/50">MEDIUM:</span>
            <span className="text-sm font-mono text-yellow-400">
              {machines.filter((m) => m.difficulty === "Medium").length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-spectral/50">HARD:</span>
            <span className="text-sm font-mono text-orange-500">
              {machines.filter((m) => m.difficulty === "Hard").length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-spectral/50">INSANE:</span>
            <span className="text-sm font-mono text-danger">
              {machines.filter((m) => m.difficulty === "Insane").length}
            </span>
          </div>
        </div>

        {/* Grid */}
        <MachinesGrid machines={machines} />

        {/* Empty state */}
        {machines.length === 0 && (
          <div className="text-center py-20 glass rounded-xl">
            <p className="text-spectral font-mono text-sm mb-2">
              No breach records found
            </p>
            <p className="text-spectral/50 text-xs">
              Add machine walkthroughs to{" "}
              <code className="text-cyan-glow/60">content/machines/</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
