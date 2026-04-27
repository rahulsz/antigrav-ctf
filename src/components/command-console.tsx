"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PLATFORMS } from "@/lib/platforms";
import type { MachineMetadata, Platform, Category, Difficulty } from "@/lib/types";
import { MachineCard } from "@/components/machine-card";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

interface CommandConsoleProps {
  machines: MachineMetadata[];
}

const CATEGORIES: Category[] = ["Linux", "Windows", "Web", "AD", "Mobile"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Insane"];

function FilterPill({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-mono border transition-all duration-200",
        active
          ? "bg-white/10 border-white/30 text-ghost"
          : "bg-transparent border-glass-border text-spectral/60 hover:text-spectral hover:border-spectral/40"
      )}
      style={
        active && color
          ? { backgroundColor: `${color}15`, borderColor: `${color}50`, color }
          : undefined
      }
    >
      {label}
    </button>
  );
}

export function CommandConsole({ machines }: CommandConsoleProps) {
  const searchParams = useSearchParams();
  const initialPlatform = searchParams.get("platform") || null;

  // Resolve initial platform from URL slug
  const resolvedInitialPlatform = initialPlatform
    ? (Object.entries(PLATFORMS).find(
        ([, config]) => config.slug === initialPlatform
      )?.[0] as Platform | undefined) || null
    : null;

  const [activePlatform, setActivePlatform] = useState<Platform | null>(resolvedInitialPlatform);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | null>(null);

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      if (activePlatform && m.platform !== activePlatform) return false;
      if (activeCategory && m.category !== activeCategory) return false;
      if (activeDifficulty && m.difficulty !== activeDifficulty) return false;
      return true;
    });
  }, [machines, activePlatform, activeCategory, activeDifficulty]);

  const hasFilters = activePlatform || activeCategory || activeDifficulty;

  const clearAll = () => {
    setActivePlatform(null);
    setActiveCategory(null);
    setActiveDifficulty(null);
  };

  return (
    <div>
      {/* Command Console */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="glass rounded-xl p-4 mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-cyan-glow/70" />
            <span className="text-xs font-mono text-cyan-glow/70 tracking-wider uppercase">
              Command Console
            </span>
          </div>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs font-mono text-spectral/50 hover:text-danger transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Source (Platform) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-spectral/40 tracking-wider uppercase w-20 shrink-0">
              Source
            </span>
            <FilterPill
              label="All"
              active={!activePlatform}
              onClick={() => setActivePlatform(null)}
            />
            {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
              <FilterPill
                key={p}
                label={PLATFORMS[p].name}
                active={activePlatform === p}
                onClick={() => setActivePlatform(activePlatform === p ? null : p)}
                color={PLATFORMS[p].color}
              />
            ))}
          </div>

          {/* Environment (Category) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-spectral/40 tracking-wider uppercase w-20 shrink-0">
              Environment
            </span>
            <FilterPill
              label="All"
              active={!activeCategory}
              onClick={() => setActiveCategory(null)}
            />
            {CATEGORIES.map((c) => (
              <FilterPill
                key={c}
                label={c}
                active={activeCategory === c}
                onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              />
            ))}
          </div>

          {/* Severity (Difficulty) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-spectral/40 tracking-wider uppercase w-20 shrink-0">
              Severity
            </span>
            <FilterPill
              label="All"
              active={!activeDifficulty}
              onClick={() => setActiveDifficulty(null)}
            />
            {DIFFICULTIES.map((d) => {
              const colorMap: Record<string, string> = {
                Easy: "#22c55e",
                Medium: "#facc15",
                Hard: "#f97316",
                Insane: "#ef4444",
              };
              return (
                <FilterPill
                  key={d}
                  label={d}
                  active={activeDifficulty === d}
                  onClick={() => setActiveDifficulty(activeDifficulty === d ? null : d)}
                  color={colorMap[d]}
                />
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 pt-3 border-t border-glass-border">
          <span className="text-[10px] font-mono text-spectral/40">
            Showing{" "}
            <span className="text-ghost font-bold">{filteredMachines.length}</span>{" "}
            of{" "}
            <span className="text-spectral/70">{machines.length}</span>{" "}
            targets
          </span>
        </div>
      </motion.div>

      {/* Machine Grid with AnimatePresence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredMachines.map((machine, idx) => (
            <motion.div
              key={`${machine.platform}-${machine.slug}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
            >
              <MachineCard
                name={machine.name}
                slug={machine.slug}
                platform={machine.platform}
                os={machine.os}
                difficulty={machine.difficulty}
                points={machine.points}
                date={machine.date}
                description={machine.description}
                index={0}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredMachines.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 glass rounded-xl"
        >
          <p className="text-spectral font-mono text-sm mb-2">
            No targets match current filters
          </p>
          <button
            onClick={clearAll}
            className="text-cyan-glow/70 text-xs font-mono hover:text-cyan-glow transition-colors"
          >
            Clear all filters →
          </button>
        </motion.div>
      )}
    </div>
  );
}
