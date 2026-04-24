// Shared types — safe for both client and server imports

export interface MachineMetadata {
  name: string;
  slug: string;
  os: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Insane";
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
