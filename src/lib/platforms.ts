// Platform configuration — client-safe (no fs dependency)

import type { Platform } from "./types";

export interface PlatformConfig {
  name: string;
  slug: string;
  fullName: string;
  color: string;
  glowColor: string;
  glowClass: string;
  bgClass: string;
  borderHover: string;
  description: string;
  icon: string; // Lucide icon name reference
}

export const PLATFORMS: Record<Platform, PlatformConfig> = {
  HTB: {
    name: "HTB",
    slug: "htb",
    fullName: "HackTheBox",
    color: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.2)",
    glowClass: "hover:shadow-[0_0_25px_rgba(6,182,212,0.2)]",
    bgClass: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    borderHover: "hover:border-cyan-500/50",
    description: "Enterprise-grade penetration testing labs with real-world attack scenarios.",
    icon: "Box",
  },
  THM: {
    name: "THM",
    slug: "thm",
    fullName: "TryHackMe",
    color: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.2)",
    glowClass: "hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]",
    bgClass: "bg-red-500/10 border-red-500/30 text-red-400",
    borderHover: "hover:border-red-500/50",
    description: "Guided learning paths with structured rooms for offensive security.",
    icon: "GraduationCap",
  },
  VulnHub: {
    name: "VulnHub",
    slug: "vulnhub",
    fullName: "VulnHub",
    color: "#7c3aed",
    glowColor: "rgba(124, 58, 237, 0.2)",
    glowClass: "hover:shadow-[0_0_25px_rgba(124,58,237,0.2)]",
    bgClass: "bg-violet-500/10 border-violet-500/30 text-violet-400",
    borderHover: "hover:border-violet-500/50",
    description: "Downloadable vulnerable VMs for offline exploitation practice.",
    icon: "HardDrive",
  },
  PTGarage: {
    name: "PTGarage",
    slug: "ptgarage",
    fullName: "PT Garage",
    color: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.2)",
    glowClass: "hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]",
    bgClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    borderHover: "hover:border-emerald-500/50",
    description: "Custom penetration testing environments and private lab infrastructure.",
    icon: "Wrench",
  },
};

export function getPlatformBySlug(slug: string): Platform | null {
  const entry = Object.entries(PLATFORMS).find(([, config]) => config.slug === slug);
  return entry ? (entry[0] as Platform) : null;
}

export function getPlatformConfig(platform: Platform): PlatformConfig {
  return PLATFORMS[platform];
}

export function getPlatformSlug(platform: Platform): string {
  return PLATFORMS[platform].slug;
}

export function getAllPlatformSlugs(): string[] {
  return Object.values(PLATFORMS).map((p) => p.slug);
}
