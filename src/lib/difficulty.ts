// Difficulty color utilities — safe for client import (no fs dependency)

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "text-success";
    case "medium":
      return "text-yellow-400";
    case "hard":
      return "text-orange-500";
    case "insane":
      return "text-danger";
    default:
      return "text-spectral";
  }
}

export function getDifficultyBg(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "bg-success/10 border-success/30";
    case "medium":
      return "bg-yellow-400/10 border-yellow-400/30";
    case "hard":
      return "bg-orange-500/10 border-orange-500/30";
    case "insane":
      return "bg-danger/10 border-danger/30";
    default:
      return "bg-spectral/10 border-spectral/30";
  }
}
