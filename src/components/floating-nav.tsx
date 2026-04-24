"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Home, Server, LayoutGrid } from "lucide-react";

const navItems = [
  { name: "Home", link: "/", icon: <Home className="w-4 h-4" /> },
  { name: "Platforms", link: "/platforms", icon: <LayoutGrid className="w-4 h-4" /> },
  { name: "Machines", link: "/machines", icon: <Server className="w-4 h-4" /> },
];

export function FloatingNav({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 100) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "fixed top-6 inset-x-0 mx-auto z-50",
            "max-w-fit",
            "glass rounded-full",
            "px-6 py-2.5",
            "flex items-center gap-1",
            "shadow-[0_0_20px_rgba(6,182,212,0.1)]",
            className
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            className="font-mono text-xs font-bold text-cyan-glow mr-4 tracking-widest"
          >
            RAHULCYBERX
          </Link>

          {/* Nav Items */}
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.link}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "text-spectral text-xs font-medium",
                "hover:text-ghost hover:bg-nebula/50",
                "transition-all duration-200"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
