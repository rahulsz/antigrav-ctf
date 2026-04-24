import Link from "next/link";
import { getAllMachines } from "@/lib/machines";
import { HeroSection } from "@/components/hero-section";
import { MachinesPreview } from "@/components/machines-preview";

export default function HomePage() {
  const machines = getAllMachines();

  return (
    <div className="relative min-h-screen">
      {/* Hero */}
      <HeroSection />

      {/* Recent Machines */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-ghost tracking-wide">
              <span className="text-cyan-glow font-mono mr-2">//</span>
              Recent Breaches
            </h2>
            <p className="text-spectral text-sm mt-1">
              Latest machine walkthroughs and exploit chains
            </p>
          </div>
          <Link
            href="/machines"
            className="text-xs font-mono text-cyan-glow/70 hover:text-cyan-glow transition-colors px-4 py-2 glass rounded-full"
          >
            View All →
          </Link>
        </div>

        <MachinesPreview machines={machines} />

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
      </section>

      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void to-transparent pointer-events-none z-20" />
    </div>
  );
}
