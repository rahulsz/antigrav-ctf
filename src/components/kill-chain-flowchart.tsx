"use client";
import { motion } from "framer-motion";
import { ChevronRight, ChevronDown } from "lucide-react";
import { PLATFORMS } from "@/lib/platforms";
import type { MachineMetadata } from "@/lib/types";

interface Section {
  id: string;
  title: string;
}

interface KillChainFlowchartProps {
  metadata: MachineMetadata;
  sections: Section[];
}

// Map section IDs to phase colors
function getPhaseColor(id: string): { border: string; text: string; glow: string } {
  const lower = id.toLowerCase();

  // Recon / Enumeration — Cyan/Blue
  if (
    lower.includes("recon") ||
    lower.includes("enumeration") ||
    lower.includes("scanning") ||
    lower.includes("discovery")
  ) {
    return {
      border: "rgba(6, 182, 212, 0.7)",
      text: "#06b6d4",
      glow: "rgba(6, 182, 212, 0.15)",
    };
  }

  // Foothold / Initial Access — Green
  if (
    lower.includes("foothold") ||
    lower.includes("initial") ||
    lower.includes("exploit") ||
    lower.includes("access")
  ) {
    return {
      border: "rgba(34, 197, 94, 0.7)",
      text: "#22c55e",
      glow: "rgba(34, 197, 94, 0.15)",
    };
  }

  // PrivEsc — Orange/White
  if (
    lower.includes("privilege") ||
    lower.includes("privesc") ||
    lower.includes("escalat") ||
    lower.includes("lateral")
  ) {
    return {
      border: "rgba(249, 115, 22, 0.7)",
      text: "#f97316",
      glow: "rgba(249, 115, 22, 0.15)",
    };
  }

  // Root / Domain Compromise — Red
  if (
    lower.includes("root") ||
    lower.includes("domain") ||
    lower.includes("compromise") ||
    lower.includes("admin") ||
    lower.includes("flag")
  ) {
    return {
      border: "rgba(239, 68, 68, 0.7)",
      text: "#ef4444",
      glow: "rgba(239, 68, 68, 0.15)",
    };
  }

  // Default — Spectral/White
  return {
    border: "rgba(148, 163, 184, 0.5)",
    text: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.1)",
  };
}

export function KillChainFlowchart({ metadata, sections }: KillChainFlowchartProps) {
  const platformConfig = PLATFORMS[metadata.platform];
  const COLS = 4; // Max columns per row

  // Split sections into rows of COLS
  const rows: Section[][] = [];
  for (let i = 0; i < sections.length; i += COLS) {
    rows.push(sections.slice(i, i + COLS));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="mb-12"
    >
      {/* Chart Container */}
      <div className="relative rounded-xl bg-abyss/90 border border-nebula/50 backdrop-blur-sm p-5 md:p-6 overflow-x-auto">
        {/* Title bar */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="text-sm font-bold text-ghost tracking-wide">
            {platformConfig?.name || metadata.platform}: {metadata.name}
          </span>
          <span
            className="text-xs font-mono italic"
            style={{ color: platformConfig?.color || "#06b6d4" }}
          >
            by RahulCyberX
          </span>
        </div>

        {/* Flow Grid - Mobile (Vertical List) */}
        <div className="flex flex-col md:hidden">
          {sections.map((section, idx) => {
            const phase = getPhaseColor(section.id);
            const isLast = idx === sections.length - 1;

            return (
              <div key={section.id} className="flex flex-col items-center w-full">
                <motion.a
                  href={`#${section.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.8 + idx * 0.08,
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="w-full px-4 py-3 rounded-md text-center cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
                  style={{
                    backgroundColor: phase.glow,
                    border: `1.5px solid ${phase.border}`,
                  }}
                  whileHover={{
                    boxShadow: `0 0 16px ${phase.glow}, 0 0 4px ${phase.border}`,
                  }}
                >
                  <span
                    className="text-[11px] font-mono font-medium tracking-wide block truncate"
                    style={{ color: phase.text }}
                  >
                    {section.title}
                  </span>
                </motion.a>

                {!isLast && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 + idx * 0.08 }}
                    className="flex flex-col items-center py-1"
                  >
                    <div className="w-px h-3 bg-spectral/20" />
                    <ChevronDown className="w-3 h-3 text-spectral/30 -my-0.5" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Flow Grid - Desktop (Horizontal Rows) */}
        <div className="hidden md:block space-y-4">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx}>
              {/* Row of boxes */}
              <div className="flex items-center gap-2">
                {row.map((section, colIdx) => {
                  const phase = getPhaseColor(section.id);
                  const isLastInRow = colIdx === row.length - 1;
                  const globalIdx = rowIdx * COLS + colIdx;

                  return (
                    <div key={section.id} className="flex items-center flex-1 min-w-0">
                      {/* Section box */}
                      <motion.a
                        href={`#${section.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.8 + globalIdx * 0.08,
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                        className="flex-1 min-w-0 px-3 py-2.5 rounded-md text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] group"
                        style={{
                          backgroundColor: phase.glow,
                          border: `1.5px solid ${phase.border}`,
                        }}
                        whileHover={{
                          boxShadow: `0 0 16px ${phase.glow}, 0 0 4px ${phase.border}`,
                        }}
                      >
                        <span
                          className="text-[11px] md:text-xs font-mono font-medium tracking-wide block truncate"
                          style={{ color: phase.text }}
                        >
                          {section.title}
                        </span>
                      </motion.a>

                      {/* Horizontal arrow */}
                      {!isLastInRow && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9 + globalIdx * 0.08 }}
                          className="flex items-center px-0.5 shrink-0"
                        >
                          <div className="w-3 h-px bg-spectral/20" />
                          <ChevronRight className="w-3 h-3 text-spectral/30 -ml-1" />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Vertical connector between rows */}
              {rowIdx < rows.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 + rowIdx * 0.15 }}
                  className="flex justify-start pl-8 py-1"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-px h-2 bg-spectral/15" />
                    <ChevronDown className="w-3 h-3 text-spectral/25 -my-0.5" />
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-nebula/30">
          {[
            { label: "Reconnaissance", color: "#06b6d4" },
            { label: "Exploitation", color: "#22c55e" },
            { label: "Escalation", color: "#f97316" },
            { label: "Compromise", color: "#ef4444" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-2 rounded-sm"
                style={{ border: `1.5px solid ${item.color}`, backgroundColor: `${item.color}15` }}
              />
              <span className="text-[9px] font-mono text-spectral/40 tracking-wider uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
