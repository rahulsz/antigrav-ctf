"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const TracingBeam = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);

  const scrollContainerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    (scrollContainerRef as React.MutableRefObject<HTMLElement | null>).current = document.documentElement;
    if (contentRef.current) {
      setSvgHeight(contentRef.current.offsetHeight);
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    container: scrollContainerRef,
    offset: ["start center", "end center"],
  });

  const y1 = useSpring(
    useTransform(scrollYProgress, [0, 0.8], [50, svgHeight]),
    { stiffness: 500, damping: 90 }
  );

  const y2 = useSpring(
    useTransform(scrollYProgress, [0, 1], [50, svgHeight - 200]),
    { stiffness: 500, damping: 90 }
  );

  return (
    <motion.div ref={ref} className={cn("relative w-full max-w-4xl mx-auto", className)}>
      <div className="absolute -left-4 md:-left-16 top-3">
        <svg
          viewBox={`0 0 20 ${svgHeight}`}
          width="20"
          height={svgHeight}
          className="block"
          aria-hidden="true"
        >
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="var(--nebula)"
            strokeWidth="1.5"
            strokeOpacity="0.2"
            transition={{ duration: 10 }}
          />
          <motion.path
            d={`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`}
            fill="none"
            stroke="url(#tracing-gradient)"
            strokeWidth="1.5"
            className="motion-reduce:hidden"
            transition={{ duration: 10 }}
          />
          <defs>
            <motion.linearGradient
              id="tracing-gradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={y1}
              y2={y2}
            >
              <stop stopColor="var(--cyan-glow)" stopOpacity="0" />
              <stop stopColor="var(--cyan-glow)" />
              <stop offset="0.325" stopColor="var(--violet-glow)" />
              <stop offset="1" stopColor="var(--violet-glow)" stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </svg>

        {/* Glow dot at the current scroll position */}
        <motion.div
          className="absolute left-[0.5px] w-[11px] h-[11px] rounded-full"
          style={{
            top: y1,
            background: "var(--cyan-glow)",
            boxShadow: "0 0 8px var(--cyan-glow), 0 0 20px rgba(6, 182, 212, 0.3)",
          }}
        />
      </div>

      <div ref={contentRef} className="pl-8 md:pl-12">
        {children}
      </div>
    </motion.div>
  );
};
