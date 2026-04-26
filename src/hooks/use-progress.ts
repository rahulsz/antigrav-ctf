"use client";

import { useState, useEffect } from "react";

const PROGRESS_KEY = "antigrav_completed_machines";

export function useProgress() {
  const [completedMachines, setCompletedMachines] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROGRESS_KEY);
      if (stored) {
        setCompletedMachines(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load progress", e);
    }
  }, []);

  const markCompleted = (machineSlug: string) => {
    setCompletedMachines((prev) => {
      if (prev.includes(machineSlug)) return prev;
      const next = [...prev, machineSlug];
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save progress", e);
      }
      return next;
    });
  };

  const isCompleted = (machineSlug: string) => {
    return completedMachines.includes(machineSlug);
  };

  return { completedMachines, markCompleted, isCompleted };
}
