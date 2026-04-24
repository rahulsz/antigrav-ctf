"use client";
import { motion } from "framer-motion";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { TracingBeam } from "@/components/ui/aceternity/tracing-beam";
import { CodeBlock } from "@/components/code-block";
import { FlagReveal } from "@/components/flag-reveal";
import { KillChainFlowchart } from "@/components/kill-chain-flowchart";
import { getDifficultyColor, getDifficultyBg } from "@/lib/difficulty";
import { PLATFORMS } from "@/lib/platforms";
import type { MachineMetadata } from "@/lib/types";
import {
  Monitor,
  Target,
  Wrench,
  ChevronLeft,
  Shield,
  Scan,
  Crosshair,
  Crown,
  Box,
  GraduationCap,
  HardDrive,
  Wifi,
  Zap,
  Calendar,
  Terminal,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  body: string;
}

interface CodeBlockData {
  lang: string;
  code: string;
  html: string;
}

interface WalkthroughContentProps {
  metadata: MachineMetadata;
  sections: Section[];
  codeBlocks: CodeBlockData[];
}

// ─── Icon Maps ───────────────────────────────────────────

const sectionIcons: Record<string, React.ReactNode> = {
  reconnaissance: <Scan className="w-5 h-5 text-cyan-glow" />,
  recon: <Scan className="w-5 h-5 text-cyan-glow" />,
  enumeration: <Scan className="w-5 h-5 text-cyan-glow" />,
  foothold: <Crosshair className="w-5 h-5 text-violet-bright" />,
  "initial-access": <Crosshair className="w-5 h-5 text-violet-bright" />,
  "privilege-escalation": <Crown className="w-5 h-5 text-orange-400" />,
  privesc: <Crown className="w-5 h-5 text-orange-400" />,
  root: <Shield className="w-5 h-5 text-danger" />,
  "root-flag": <Shield className="w-5 h-5 text-danger" />,
  "user-flag": <Target className="w-5 h-5 text-success" />,
};

const platformIcons: Record<string, React.ReactNode> = {
  HTB: <Box className="w-4 h-4" />,
  THM: <GraduationCap className="w-4 h-4" />,
  VulnHub: <HardDrive className="w-4 h-4" />,
  PTGarage: <Wrench className="w-4 h-4" />,
};

function getOSIcon(os: string) {
  const lower = os.toLowerCase();
  if (lower.includes("linux")) return <Terminal className="w-4 h-4" />;
  if (lower.includes("windows")) return <Monitor className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

function getSectionIcon(id: string) {
  return sectionIcons[id] || <Target className="w-5 h-5 text-spectral" />;
}

// ─── Markdown Rendering ──────────────────────────────────

function renderBody(body: string, codeBlocks: CodeBlockData[]) {
  const parts = body.split(/__CODEBLOCK_(\d+)__/);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const text = parts[i].trim();
      if (text) {
        const lines = text.split("\n").filter((l) => l.trim());
        elements.push(
          <div key={`text-${i}`} className="space-y-3">
            {lines.map((line, j) => {
              if (line.startsWith("### ")) {
                return (
                  <h4
                    key={j}
                    className="text-ghost font-semibold text-base mt-6 mb-2 flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />
                    {line.replace("### ", "")}
                  </h4>
                );
              }

              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <div key={j} className="flex gap-2 pl-2">
                    <span className="text-cyan-glow mt-1.5 text-xs">▸</span>
                    <p className="text-spectral text-sm leading-relaxed">
                      {renderInlineMarkdown(line.slice(2))}
                    </p>
                  </div>
                );
              }

              return (
                <p key={j} className="text-spectral text-sm leading-relaxed">
                  {renderInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      }
    } else {
      const blockIdx = parseInt(parts[i]);
      const block = codeBlocks[blockIdx];
      if (block) {
        elements.push(
          <CodeBlock
            key={`code-${blockIdx}`}
            code={block.code}
            highlightedHtml={block.html}
            language={block.lang}
          />
        );
      }
    }
  }

  return elements;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="text-cyan-glow/90 bg-cyan-glow/5 px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/);
    return boldParts.map((bp, j) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return (
          <strong key={`${i}-${j}`} className="text-ghost font-semibold">
            {bp.slice(2, -2)}
          </strong>
        );
      }
      return bp;
    });
  });
}

// ─── Telemetry Cell Sub-Component ────────────────────────

function TelemetryCell({
  label,
  children,
  delay = 0,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative p-4 rounded-xl bg-abyss/60 border border-nebula/50 backdrop-blur-sm ${className}`}
    >
      <span className="block text-[9px] font-mono text-spectral/40 tracking-widest uppercase mb-2">
        {label}
      </span>
      {children}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function WalkthroughContent({
  metadata,
  sections,
  codeBlocks,
}: WalkthroughContentProps) {
  const platformConfig = PLATFORMS[metadata.platform];

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-24">
      {/* ── Back Link ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          href="/machines"
          className="inline-flex items-center gap-1 text-spectral/60 text-xs font-mono hover:text-cyan-glow transition-colors mb-8"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Machines
        </Link>
      </motion.div>

      {/* ══════════════════════════════════════════════════
          VM TELEMETRY DASHBOARD — Glassmorphic Hero
         ══════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden mb-10"
      >
        {/* Background layer — abyss + nebula border */}
        <div className="absolute inset-0 bg-abyss/80 backdrop-blur-xl" />
        <div className="absolute inset-0 rounded-2xl border border-nebula/40" />

        {/* Decorative scan-line */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-glow/20 to-transparent"
            style={{ animation: "scan-line 4s linear infinite" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8">
          {/* Title Row */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-8 bg-danger/50" />
                <span className="text-[10px] font-mono text-danger/70 tracking-widest uppercase">
                  System Breach
                </span>
              </div>
              <TextGenerateEffect
                words={`SYSTEM BREACH: ${metadata.name.toUpperCase()}`}
                className="text-2xl md:text-4xl lg:text-5xl tracking-tight"
                duration={0.3}
              />
            </div>

            {/* Date badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-1.5 text-spectral/40 text-xs font-mono shrink-0 mt-2"
            >
              <Calendar className="w-3 h-3" />
              {metadata.date}
            </motion.div>
          </div>

          {/* ── Telemetry Grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Target IP — pulsing JetBrains Mono */}
            <TelemetryCell label="Target IP" delay={0.3} className="col-span-2 md:col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full bg-success shrink-0"
                  style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
                />
                <span className="font-mono text-sm text-ghost tracking-wide">
                  {metadata.ip}
                </span>
              </div>
            </TelemetryCell>

            {/* Platform */}
            <TelemetryCell label="Platform" delay={0.35}>
              <div className="flex items-center gap-2">
                <span style={{ color: platformConfig?.color }}>
                  {platformIcons[metadata.platform]}
                </span>
                <span
                  className="font-mono text-sm font-semibold"
                  style={{ color: platformConfig?.color }}
                >
                  {platformConfig?.fullName || metadata.platform}
                </span>
              </div>
            </TelemetryCell>

            {/* OS / Category */}
            <TelemetryCell label="Environment" delay={0.4}>
              <div className="flex items-center gap-2">
                <span className="text-cyan-glow/70">
                  {getOSIcon(metadata.os)}
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-ghost">{metadata.os}</span>
                  <span className="text-[9px] font-mono text-spectral/40">{metadata.category}</span>
                </div>
              </div>
            </TelemetryCell>

            {/* Difficulty — dynamic severity colors */}
            <TelemetryCell label="Severity" delay={0.45}>
              <span
                className={`inline-flex items-center gap-1.5 font-mono text-sm font-bold px-2.5 py-0.5 rounded-md border ${getDifficultyBg(metadata.difficulty)} ${getDifficultyColor(metadata.difficulty)}`}
              >
                <Wifi className="w-3 h-3" />
                {metadata.difficulty}
              </span>
            </TelemetryCell>

            {/* Points */}
            <TelemetryCell label="Bounty" delay={0.5}>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-glow" />
                <span className="font-mono text-lg font-bold text-ghost">
                  {metadata.points}
                </span>
                <span className="text-[9px] font-mono text-spectral/40 mt-1">PTS</span>
              </div>
            </TelemetryCell>
          </div>

          {/* ── Tools Arsenal ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 pt-4 border-t border-nebula/30"
          >
            <span className="block text-[9px] font-mono text-spectral/40 tracking-widest uppercase mb-2">
              Arsenal
            </span>
            <div className="flex flex-wrap gap-1.5">
              {metadata.tools.map((tool, idx) => (
                <motion.span
                  key={tool}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.65 + idx * 0.03 }}
                  className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-cyan-glow/5 text-cyan-glow/80 border border-cyan-glow/15 hover:border-cyan-glow/40 hover:bg-cyan-glow/10 transition-all duration-200"
                >
                  {tool}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════
          KILL CHAIN FLOWCHART — Attack Vector Bridge
         ══════════════════════════════════════════════════ */}
      <KillChainFlowchart metadata={metadata} sections={sections} />

      {/* ══════════════════════════════════════════════════
          KILL CHAIN — Content Sections (TracingBeam)
         ══════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="h-px w-8 bg-cyan-glow/50" />
          <span className="text-xs font-mono text-cyan-glow/70 tracking-widest uppercase">
            Kill Chain
          </span>
        </div>

        <TracingBeam>
          {/* prose prose-invert MDX container */}
          <article className="prose prose-invert prose-sm max-w-none prose-headings:text-ghost prose-p:text-spectral prose-strong:text-ghost prose-code:text-cyan-glow/90">
            <div className="space-y-16">
              {sections.map((section, idx) => (
                <div key={section.id} id={section.id}>
                  {/* Section header */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 mb-6 not-prose"
                  >
                    <div className="p-2 rounded-lg bg-abyss border border-glass-border">
                      {getSectionIcon(section.id)}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-spectral/40 tracking-wider uppercase">
                        Phase {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-xl font-bold text-ghost !mt-0 !mb-0">
                        {section.title}
                      </h2>
                    </div>
                  </motion.div>

                  {/* Section content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="space-y-4 not-prose"
                  >
                    {renderBody(section.body, codeBlocks)}
                  </motion.div>
                </div>
              ))}

              {/* ── Flag Reveals ── */}
              <div id="flags" className="space-y-6 not-prose">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="p-2 rounded-lg bg-abyss border border-glass-border">
                    <Shield className="w-5 h-5 text-danger" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-spectral/40 tracking-wider uppercase">
                      Final Phase
                    </span>
                    <h2 className="text-xl font-bold text-ghost">
                      Flag Capture
                    </h2>
                  </div>
                </motion.div>

                {metadata.userFlag && (
                  <FlagReveal flag={metadata.userFlag} type="user" />
                )}
                {metadata.rootFlag && (
                  <FlagReveal flag={metadata.rootFlag} type="root" />
                )}
              </div>
            </div>
          </article>
        </TracingBeam>
      </motion.div>
    </div>
  );
}
