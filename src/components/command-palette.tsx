"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Monitor, Terminal, FileText, ChevronRight } from "lucide-react";
import { PLATFORMS } from "@/lib/platforms";
import type { MachineMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  machines: MachineMetadata[];
}

export function CommandPalette({ machines }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 pt-[20vh]",
        "bg-void/80 backdrop-blur-sm"
      )}
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-glass-border bg-abyss/90 shadow-2xl shadow-cyan-glow/10">
        <Command
          className="flex h-full w-full flex-col overflow-hidden"
        >
          <div className="flex items-center border-b border-glass-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-spectral/50" />
            <Command.Input
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm text-ghost outline-none placeholder:text-spectral/50"
              placeholder="Search machines, platforms, tools..."
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-spectral">
              No results found.
            </Command.Empty>

            <Command.Group heading={<span className="text-[10px] font-mono text-spectral/40 uppercase tracking-widest px-2 pb-1 block">Machines</span>}>
              {machines.map((machine) => {
                const platformConfig = PLATFORMS[machine.platform];
                // Determine platform slug safely. Fallback to lowercase platform string.
                const platformSlug = Object.entries(PLATFORMS).find(([_, p]) => p.name === machine.platform)?.[0] || machine.platform.toLowerCase();
                
                return (
                  <Command.Item
                    key={`${machine.platform}-${machine.slug}`}
                    value={`${machine.name} ${machine.platform} ${machine.tools?.join(" ")}`}
                    onSelect={() => runCommand(() => router.push(`/machines/${platformSlug}/${machine.slug}`))}
                    className="flex cursor-pointer select-none items-center rounded-md px-2 py-2.5 text-sm text-spectral outline-none hover:bg-nebula hover:text-ghost aria-selected:bg-nebula aria-selected:text-ghost data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    {machine.os.toLowerCase().includes("windows") ? (
                      <Monitor className="mr-2 h-4 w-4 text-cyan-glow/70" />
                    ) : (
                      <Terminal className="mr-2 h-4 w-4 text-cyan-glow/70" />
                    )}
                    <span className="flex-1 font-semibold">{machine.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-glass-border">
                        {machine.difficulty}
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: platformConfig?.color || "#94a3b8" }}
                      >
                        {platformConfig?.fullName || machine.platform}
                      </span>
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-glass-border" />

            <Command.Group heading={<span className="text-[10px] font-mono text-spectral/40 uppercase tracking-widest px-2 pb-1 block">Quick Links</span>}>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/machines"))}
                className="flex cursor-pointer select-none items-center rounded-md px-2 py-2.5 text-sm text-spectral outline-none hover:bg-nebula hover:text-ghost aria-selected:bg-nebula aria-selected:text-ghost"
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>View All Machines</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/platforms"))}
                className="flex cursor-pointer select-none items-center rounded-md px-2 py-2.5 text-sm text-spectral outline-none hover:bg-nebula hover:text-ghost aria-selected:bg-nebula aria-selected:text-ghost"
              >
                <ChevronRight className="mr-2 h-4 w-4" />
                <span>Browse Platforms</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </Command.Dialog>
  );
}
