"use client";
import { motion } from "framer-motion";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { TracingBeam } from "@/components/ui/aceternity/tracing-beam";
import { BentoGrid, BentoGridItem } from "@/components/ui/aceternity/bento-grid";
import { CardSpotlight } from "@/components/ui/aceternity/card-spotlight";
import { CodeBlock } from "@/components/code-block";
import { FlagReveal } from "@/components/flag-reveal";
import { getDifficultyColor, getDifficultyBg } from "@/lib/difficulty";
import type { MachineMetadata } from "@/lib/types";
import {
  Monitor,
  Gauge,
  Target,
  Wrench,
  Calendar,
  Globe,
  ChevronLeft,
  Shield,
  Scan,
  Crosshair,
  Crown,
} from "lucide-react";
import Link from "next/link";

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

const sectionIcons: Record<string, React.ReactNode> = {
  reconnaissance: <Scan className="w-5 h-5 text-cyan-glow" />,
  recon: <Scan className="w-5 h-5 text-cyan-glow" />,
  enumeration: <Scan className="w-5 h-5 text-cyan-glow" />,
  foothold: <Crosshair className="w-5 h-5 text-violet-bright" />,
  "initial-access": <Crosshair className="w-5 h-5 text-violet-bright" />,
  "privilege-escalation": <Crown className="w-5 h-5 text-orange-400" />,
  "privesc": <Crown className="w-5 h-5 text-orange-400" />,
  root: <Shield className="w-5 h-5 text-danger" />,
  "root-flag": <Shield className="w-5 h-5 text-danger" />,
  "user-flag": <Target className="w-5 h-5 text-success" />,
};

function getSectionIcon(id: string) {
  return sectionIcons[id] || <Target className="w-5 h-5 text-spectral" />;
}

function renderBody(body: string, codeBlocks: CodeBlockData[]) {
  // Split body by codeblock markers
  const parts = body.split(/__CODEBLOCK_(\d+)__/);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Text content
      const text = parts[i].trim();
      if (text) {
        // Parse inline markdown
        const lines = text.split("\n").filter((l) => l.trim());
        elements.push(
          <div key={`text-${i}`} className="space-y-3">
            {lines.map((line, j) => {
              // Bold
              let processed: React.ReactNode = line;

              // Handle ### subheadings
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

              // Handle list items
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
      // Code block
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
  // Handle inline code
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
    // Handle bold
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

export function WalkthroughContent({
  metadata,
  sections,
  codeBlocks,
}: WalkthroughContentProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-24">
      {/* Back link */}
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

      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-danger/50" />
          <span className="text-xs font-mono text-danger/70 tracking-widest uppercase">
            System Breach
          </span>
        </div>
        <TextGenerateEffect
          words={`SYSTEM BREACH: ${metadata.name.toUpperCase()}`}
          className="text-3xl md:text-5xl tracking-tight"
          duration={0.3}
        />
      </motion.div>

      {/* Bento Grid Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mb-16"
      >
        <BentoGrid className="md:auto-rows-[10rem] max-w-4xl">
          <BentoGridItem
            title="Operating System"
            description={metadata.os}
            header={
              <div className="flex items-center justify-center h-full">
                <Monitor className="w-10 h-10 text-cyan-glow/60" />
              </div>
            }
            className="md:col-span-1"
          />
          <BentoGridItem
            title="Difficulty"
            description={
              <span className={getDifficultyColor(metadata.difficulty)}>
                {metadata.difficulty}
              </span>
            }
            header={
              <div className="flex items-center justify-center h-full">
                <Gauge className="w-10 h-10 text-violet-bright/60" />
              </div>
            }
            className="md:col-span-1"
          />
          <BentoGridItem
            title="Tools Used"
            description={
              <div className="flex flex-wrap gap-1.5 mt-1">
                {metadata.tools.map((tool) => (
                  <span
                    key={tool}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-glow/5 text-cyan-glow/80 border border-cyan-glow/20"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            }
            header={
              <div className="flex items-center justify-center h-full">
                <Wrench className="w-10 h-10 text-cyan-glow/60" />
              </div>
            }
            className="md:col-span-1"
          />
          <BentoGridItem
            title="Points / IP"
            description={
              <div className="flex items-center gap-3">
                <span className="text-cyan-glow font-mono font-bold">
                  {metadata.points} pts
                </span>
                <span className="text-spectral/40">|</span>
                <span className="font-mono text-spectral/70">{metadata.ip}</span>
              </div>
            }
            header={
              <div className="flex items-center justify-center h-full">
                <Globe className="w-10 h-10 text-violet-bright/60" />
              </div>
            }
            className="md:col-span-2"
          />
          <BentoGridItem
            title="Date"
            description={metadata.date}
            header={
              <div className="flex items-center justify-center h-full">
                <Calendar className="w-10 h-10 text-spectral/40" />
              </div>
            }
            className="md:col-span-1"
          />
        </BentoGrid>
      </motion.div>

      {/* Kill Chain — Tracing Beam */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="h-px w-8 bg-cyan-glow/50" />
          <span className="text-xs font-mono text-cyan-glow/70 tracking-widest uppercase">
            Kill Chain
          </span>
        </div>

        <TracingBeam>
          <div className="space-y-16">
            {sections.map((section, idx) => (
              <div key={section.id} id={section.id}>
                {/* Section header */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="p-2 rounded-lg bg-abyss border border-glass-border">
                    {getSectionIcon(section.id)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-spectral/40 tracking-wider uppercase">
                      Phase {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-xl font-bold text-ghost">
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
                  className="space-y-4"
                >
                  {renderBody(section.body, codeBlocks)}
                </motion.div>
              </div>
            ))}

            {/* Flag Reveals */}
            <div id="flags" className="space-y-6">
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
        </TracingBeam>
      </motion.div>
    </div>
  );
}
