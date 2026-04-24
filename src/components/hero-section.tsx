"use client";
import { BackgroundBeams } from "@/components/ui/aceternity/background-beams";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { FloatingNav } from "@/components/floating-nav";
import { motion } from "framer-motion";
import { Shield, ArrowDown } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Beams */}
      <BackgroundBeams className="z-0" />

      {/* Floating Nav */}
      <FloatingNav />

      {/* Hero Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full mb-8"
        >
          <Shield className="w-3.5 h-3.5 text-cyan-glow" />
          <span className="text-xs font-mono text-spectral tracking-wider">
            SECURITY RESEARCH INTERFACE v2.0
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <TextGenerateEffect
            words="RAHULCYBERX // BREACH PROTOCOL"
            className="text-4xl md:text-6xl lg:text-7xl tracking-tight"
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mt-6 text-spectral text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
        >
          A deep-space forensic workstation for CTF walkthroughs.{" "}
          <span className="text-cyan-glow/80">Recon</span> /{" "}
          <span className="text-violet-bright/80">Exploit</span> /{" "}
          <span className="text-danger/80">Root</span> — documented with surgical precision.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <a
            href="#machines"
            className="group flex items-center gap-2 px-6 py-3 rounded-lg font-mono text-sm font-semibold text-void bg-cyan-glow hover:bg-cyan-bright transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Access Terminals
            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </a>
        </motion.div>

        {/* Decorative scan line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="mt-16 flex items-center gap-3 justify-center"
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-glow/40" />
          <span className="text-[10px] font-mono text-spectral/40 tracking-[0.3em]">
            SYSTEM ACTIVE
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-glow/40" />
        </motion.div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-void to-transparent z-10" />
    </div>
  );
}
