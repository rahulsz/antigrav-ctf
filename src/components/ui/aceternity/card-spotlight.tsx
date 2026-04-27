"use client";
import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const CardSpotlight = ({
  children,
  className,
  color,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const spotlightColor = color || "rgba(6, 182, 212, 0.1)";
  const borderColor = color
    ? color.replace(/[\d.]+\)$/, "0.2)")
    : "rgba(6, 182, 212, 0.2)";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "glass transition-all duration-300",
        className
      )}
    >
      {/* Spotlight overlay */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      {/* Border glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${borderColor}, transparent 40%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "xor",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
