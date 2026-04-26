"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MultiStepLoader } from "@/components/ui/aceternity/multi-step-loader";
import { Lock, Unlock, ShieldCheck } from "lucide-react";
import { useProgress } from "@/hooks/use-progress";

const loadingStates = [
  { text: "Scanning memory segments..." },
  { text: "Extracting password hash..." },
  { text: "Brute-forcing encryption key..." },
  { text: "Bypassing integrity checks..." },
  { text: "Decrypted!" },
];

export function FlagReveal({
  flag,
  type = "root",
  machineSlug,
}: {
  flag: string;
  type?: "user" | "root";
  machineSlug?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const { markCompleted } = useProgress();

  const isRoot = type === "root";
  const accentColor = isRoot ? "var(--danger)" : "var(--success)";
  const label = isRoot ? "Root Flag" : "User Flag";

  const handleReveal = () => {
    if (revealed) return;
    setLoading(true);
  };

  const handleComplete = () => {
    setTimeout(() => {
      setLoading(false);
      setRevealed(true);
      if (isRoot && machineSlug) {
        markCompleted(machineSlug);
      }
    }, 500);
  };

  return (
    <>
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={loading}
        duration={1200}
        onComplete={handleComplete}
      />

      <div className="my-8">
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.button
              key="locked"
              onClick={handleReveal}
              className="group relative flex items-center gap-3 px-6 py-3 rounded-lg glass overflow-hidden transition-all duration-300"
              style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accentColor} 10%, transparent), transparent)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s infinite",
                }}
              />

              <Lock className="w-5 h-5 relative z-10" style={{ color: accentColor }} />
              <span className="font-mono text-sm relative z-10" style={{ color: accentColor }}>
                Decrypt {label}
              </span>
            </motion.button>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass rounded-lg p-4 border"
              style={{
                borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                boxShadow: `0 0 20px color-mix(in srgb, ${accentColor} 15%, transparent), 0 0 40px color-mix(in srgb, ${accentColor} 5%, transparent)`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {isRoot ? (
                  <ShieldCheck className="w-4 h-4" style={{ color: accentColor }} />
                ) : (
                  <Unlock className="w-4 h-4" style={{ color: accentColor }} />
                )}
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: accentColor }}>
                  {label} Decrypted
                </span>
              </div>
              <motion.code
                className="font-mono text-sm block"
                style={{ color: accentColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {flag}
              </motion.code>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
