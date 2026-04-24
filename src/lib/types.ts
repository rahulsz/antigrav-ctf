// Shared types — safe for both client and server imports

export type Platform = "HTB" | "THM" | "VulnHub" | "PTGarage";
export type Category = "Linux" | "Windows" | "Web" | "AD" | "Mobile";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Insane";

export interface MachineMetadata {
  name: string;
  slug: string;
  platform: Platform;
  category: Category;
  os: string;
  difficulty: Difficulty;
  points: number;
  ip: string;
  date: string;
  tools: string[];
  userFlag: string;
  rootFlag: string;
  tags?: string[];
  description?: string;
}

export interface Machine {
  metadata: MachineMetadata;
  content: string;
}
