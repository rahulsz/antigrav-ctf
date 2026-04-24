"use client";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-xl group/bento relative",
        "glass transition-all duration-300",
        "hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
        "hover:border-cyan-glow/30",
        "p-4 flex flex-col justify-between space-y-4",
        className
      )}
    >
      {header}
      <div className="transition-all duration-300">
        {icon}
        <div className="font-sans font-bold text-ghost mb-2 mt-2 text-sm">
          {title}
        </div>
        <div className="font-sans font-normal text-spectral text-xs leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};
