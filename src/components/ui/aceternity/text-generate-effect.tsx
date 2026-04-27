"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) => {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(" ");

  useEffect(() => {
    if (scope.current) {
      animate(
        "span",
        { opacity: 1, filter: filter ? "blur(0px)" : "none" },
        { duration, delay: stagger(0.08) }
      );
    }
  }, [scope, animate, filter, duration]);

  return (
    <div className={cn("font-bold", className)}>
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, idx) => (
          <motion.span
            key={`${word}-${idx}`}
            className="text-ghost opacity-0 inline-block mr-[0.25em]"
            style={{ filter: filter ? "blur(8px)" : "none" }}
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};
