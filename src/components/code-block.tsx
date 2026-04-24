"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  highlightedHtml: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({
  code,
  highlightedHtml,
  language = "bash",
  filename,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "relative group rounded-lg overflow-hidden my-4",
        "glass",
        "border-glass-border",
        className
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-glass-border">
        <div className="flex items-center gap-2">
          {/* Terminal dots */}
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-danger/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
          </div>
          {filename && (
            <span className="text-spectral/60 text-xs font-mono ml-2">
              {filename}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language badge */}
          <span className="text-[10px] font-mono uppercase tracking-wider text-spectral/40 px-2 py-0.5 rounded bg-nebula/50">
            {language}
          </span>

          {/* Copy button */}
          <motion.button
            onClick={handleCopy}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              "text-spectral/50 hover:text-ghost",
              "hover:bg-nebula/50",
              "opacity-0 group-hover:opacity-100 transition-opacity"
            )}
            whileTap={{ scale: 0.9 }}
            aria-label="Copy code"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Check className="w-4 h-4 text-success" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Copy className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Code content */}
      <div
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  );
}
