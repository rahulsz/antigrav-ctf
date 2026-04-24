"use client";
import { motion } from "framer-motion";
import { CardSpotlight } from "@/components/ui/aceternity/card-spotlight";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/lib/types";
import {
  Box,
  GraduationCap,
  HardDrive,
  Wrench,
  ChevronRight,
  Server,
} from "lucide-react";
import Link from "next/link";

const platformIcons: Record<string, React.ReactNode> = {
  HTB: <Box className="w-8 h-8" />,
  THM: <GraduationCap className="w-8 h-8" />,
  VulnHub: <HardDrive className="w-8 h-8" />,
  PTGarage: <Wrench className="w-8 h-8" />,
};

interface PlatformCardProps {
  platform: Platform;
  machineCount: number;
  index: number;
}

export function PlatformCard({ platform, machineCount, index }: PlatformCardProps) {
  const config = PLATFORMS[platform];

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
      <Link href={`/machines?platform=${config.slug}`}>
        <CardSpotlight
          className="h-full"
          color={config.glowColor}
        >
          <div className="relative p-6 flex flex-col h-full min-h-[220px]">
            {/* Icon */}
            <div
              className="p-3 rounded-xl w-fit mb-4"
              style={{
                backgroundColor: `${config.color}10`,
                color: config.color,
              }}
            >
              {platformIcons[platform] || <Server className="w-8 h-8" />}
            </div>

            {/* Name */}
            <h3 className="text-xl font-bold text-ghost mb-1">
              {config.fullName}
            </h3>
            <span
              className="text-xs font-mono mb-3"
              style={{ color: config.color }}
            >
              {config.name}
            </span>

            {/* Description */}
            <p className="text-spectral text-xs leading-relaxed mb-4 flex-grow">
              {config.description}
            </p>

            {/* Footer */}
            <div
              className="flex items-center justify-between pt-3 border-t border-glass-border"
            >
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-spectral/50" />
                <span className="text-xs font-mono text-spectral/70">
                  {machineCount} {machineCount === 1 ? "machine" : "machines"}
                </span>
              </div>
              <div
                className="flex items-center gap-1 text-xs font-mono"
                style={{ color: config.color }}
              >
                Enter Sector
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </CardSpotlight>
      </Link>
    </motion.div>
  );
}
