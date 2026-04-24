"use client";
import { MachineCard } from "@/components/machine-card";
import type { MachineMetadata } from "@/lib/types";

export function MachinesPreview({ machines }: { machines: MachineMetadata[] }) {
  return (
    <div id="machines" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {machines.slice(0, 6).map((machine, idx) => (
        <MachineCard
          key={`${machine.platform}-${machine.slug}`}
          name={machine.name}
          slug={machine.slug}
          platform={machine.platform}
          os={machine.os}
          difficulty={machine.difficulty}
          points={machine.points}
          date={machine.date}
          description={machine.description}
          index={idx}
        />
      ))}
    </div>
  );
}
