"use client";
import { MachineCard } from "@/components/machine-card";
import type { MachineMetadata } from "@/lib/types";

export function MachinesGrid({ machines }: { machines: MachineMetadata[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {machines.map((machine, idx) => (
        <MachineCard
          key={machine.slug}
          name={machine.name}
          slug={machine.slug}
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
