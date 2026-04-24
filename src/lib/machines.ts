import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { MachineMetadata, Machine, Platform } from "./types";
import { getPlatformBySlug, getAllPlatformSlugs } from "./platforms";

export type { MachineMetadata, Machine };

const CONTENT_DIR = path.join(process.cwd(), "content", "machines");

/**
 * Get all machines across all platform directories.
 * Traverses: content/machines/[platform]/[slug]/walkthrough.md
 */
export function getAllMachines(): MachineMetadata[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const machines: MachineMetadata[] = [];
  const platformDirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

  for (const platformDir of platformDirs) {
    if (!platformDir.isDirectory()) continue;

    const platformSlug = platformDir.name;
    const platformPath = path.join(CONTENT_DIR, platformSlug);
    const machineDirs = fs.readdirSync(platformPath, { withFileTypes: true });

    for (const machineDir of machineDirs) {
      if (!machineDir.isDirectory()) continue;

      const filePath = path.join(platformPath, machineDir.name, "walkthrough.md");
      if (!fs.existsSync(filePath)) continue;

      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);

      // Resolve platform from directory name if not in frontmatter
      const platform = data.platform || getPlatformBySlug(platformSlug) || platformSlug.toUpperCase();

      machines.push({
        ...data,
        slug: machineDir.name,
        platform,
      } as MachineMetadata);
    }
  }

  // Sort by date, newest first
  return machines.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get machines filtered by platform slug (e.g., "htb", "thm").
 */
export function getMachinesByPlatform(platformSlug: string): MachineMetadata[] {
  return getAllMachines().filter((m) => {
    const config = getPlatformBySlug(platformSlug);
    return config ? m.platform === config : false;
  });
}

/**
 * Get a single machine by platform slug + machine slug.
 * Prevents collisions when two platforms have same machine name.
 */
export function getMachineBySlug(platformSlug: string, slug: string): Machine | null {
  const filePath = path.join(CONTENT_DIR, platformSlug, slug, "walkthrough.md");

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  const platform = data.platform || getPlatformBySlug(platformSlug) || platformSlug.toUpperCase();

  return {
    metadata: {
      ...data,
      slug,
      platform,
    } as MachineMetadata,
    content,
  };
}

/**
 * Get all { platform, slug } pairs for generateStaticParams.
 */
export function getMachineParams(): { platform: string; slug: string }[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const params: { platform: string; slug: string }[] = [];
  const platformDirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

  for (const platformDir of platformDirs) {
    if (!platformDir.isDirectory()) continue;

    const platformPath = path.join(CONTENT_DIR, platformDir.name);
    const machineDirs = fs.readdirSync(platformPath, { withFileTypes: true });

    for (const machineDir of machineDirs) {
      if (!machineDir.isDirectory()) continue;

      const filePath = path.join(platformPath, machineDir.name, "walkthrough.md");
      if (!fs.existsSync(filePath)) continue;

      params.push({
        platform: platformDir.name,
        slug: machineDir.name,
      });
    }
  }

  return params;
}
