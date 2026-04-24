import { getAllMachines } from "@/lib/machines";
import { FloatingNav } from "@/components/floating-nav";
import { PlatformCard } from "@/components/platform-card";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platforms",
  description: "Select a CTF platform sector — HackTheBox, TryHackMe, VulnHub, or PT Garage.",
};

export default function PlatformsPage() {
  const machines = getAllMachines();

  // Count machines per platform
  const platformCounts: Record<string, number> = {};
  for (const m of machines) {
    platformCounts[m.platform] = (platformCounts[m.platform] || 0) + 1;
  }

  const platforms = Object.keys(PLATFORMS) as Platform[];

  return (
    <div className="relative min-h-screen">
      <FloatingNav />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-violet-bright/50" />
            <span className="text-xs font-mono text-violet-bright/70 tracking-widest uppercase">
              Sector Select
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ghost tracking-tight">
            Platform Sectors
          </h1>
          <p className="text-spectral mt-2 text-sm max-w-xl">
            Choose your arena. Each sector contains walkthroughs from a
            specific CTF platform, with dedicated tooling and attack vectors.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-8 py-3 px-5 glass rounded-lg w-fit">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-spectral/50">TOTAL MACHINES:</span>
            <span className="text-sm font-mono font-bold text-ghost">{machines.length}</span>
          </div>
          <div className="w-px h-4 bg-glass-border" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-spectral/50">SECTORS:</span>
            <span className="text-sm font-mono font-bold text-ghost">{platforms.length}</span>
          </div>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform, idx) => (
            <PlatformCard
              key={platform}
              platform={platform}
              machineCount={platformCounts[platform] || 0}
              index={idx}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
