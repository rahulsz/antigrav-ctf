import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { MachineMetadata, Machine } from "./types";

export type { MachineMetadata, Machine };

const CONTENT_DIR = path.join(process.cwd(), "content", "machines");

export function getAllMachines(): MachineMetadata[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const dirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

  const machines = dirs
    .filter((d) => d.isDirectory())
    .map((dir) => {
      const filePath = path.join(CONTENT_DIR, dir.name, "walkthrough.md");
      if (!fs.existsSync(filePath)) return null;

      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);

      return {
        ...data,
        slug: dir.name,
      } as MachineMetadata;
    })
    .filter(Boolean) as MachineMetadata[];

  // Sort by date, newest first
  return machines.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getMachineBySlug(slug: string): Machine | null {
  const filePath = path.join(CONTENT_DIR, slug, "walkthrough.md");

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    metadata: {
      ...data,
      slug,
    } as MachineMetadata,
    content,
  };
}

export function getMachineSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}
