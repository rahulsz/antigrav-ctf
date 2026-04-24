"use client";
import { motion } from "framer-motion";
import { CardSpotlight } from "@/components/ui/aceternity/card-spotlight";
import { getDifficultyColor, getDifficultyBg } from "@/lib/difficulty";
import { Monitor, Apple, Terminal, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

interface MachineCardProps {
  name: string;
  slug: string;
  os: string;
  difficulty: string;
  points: number;
  date: string;
  description?: string;
  index?: number;
}

function getOSIcon(os: string) {
  const lower = os.toLowerCase();
  if (lower.includes("linux")) return <Terminal className="w-5 h-5" />;
  if (lower.includes("mac") || lower.includes("darwin")) return <Apple className="w-5 h-5" />;
  return <Monitor className="w-5 h-5" />;
}

export function MachineCard({
  name,
  slug,
  os,
  difficulty,
  points,
  date,
  description,
  index = 0,
}: MachineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 30,
        delay: index * 0.1,
      }}
    >
      <Link href={`/machines/${slug}`}>
        <CardSpotlight className="h-full">
          <div className="p-5 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-glow/10 text-cyan-glow">
                  {getOSIcon(os)}
                </div>
                <div>
                  <h3 className="font-bold text-ghost text-base tracking-wide">
                    {name}
                  </h3>
                  <span className="text-spectral/60 text-xs font-mono">{os}</span>
                </div>
              </div>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border ${getDifficultyBg(difficulty)} ${getDifficultyColor(difficulty)}`}
              >
                {difficulty}
              </span>
            </div>

            {/* Description */}
            {description && (
              <p className="text-spectral text-xs leading-relaxed mb-4 flex-grow">
                {description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-glass-border">
              <div className="flex items-center gap-3">
                <span className="text-cyan-glow font-mono text-xs font-bold">
                  {points} pts
                </span>
                <span className="flex items-center gap-1 text-spectral/50 text-xs">
                  <Calendar className="w-3 h-3" />
                  {date}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-spectral/40 group-hover:text-cyan-glow transition-colors" />
            </div>
          </div>
        </CardSpotlight>
      </Link>
    </motion.div>
  );
}
