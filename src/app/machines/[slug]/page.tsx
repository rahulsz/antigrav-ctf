import { notFound } from "next/navigation";
import { getMachineBySlug, getMachineSlugs } from "@/lib/machines";
import { highlightCode } from "@/lib/shiki";
import { FloatingNav } from "@/components/floating-nav";
import { WalkthroughContent } from "./walkthrough-content";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getMachineSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const machine = getMachineBySlug(slug);
  if (!machine) return { title: "Not Found" };

  return {
    title: `${machine.metadata.name} — ${machine.metadata.difficulty}`,
    description: `CTF walkthrough for ${machine.metadata.name}. ${machine.metadata.os} | ${machine.metadata.difficulty} | ${machine.metadata.points} pts`,
  };
}

// Parse markdown into sections and highlight code blocks
async function parseContent(content: string) {
  const sections: Array<{
    id: string;
    title: string;
    content: string;
  }> = [];

  // Split by ## headings
  const parts = content.split(/^## /m);

  for (const part of parts) {
    if (!part.trim()) continue;

    const lines = part.split("\n");
    const title = lines[0].trim();
    let body = lines.slice(1).join("\n");

    // Process code blocks with Shiki
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    const replacements: Array<{ original: string; html: string; lang: string; code: string }> = [];

    while ((match = codeBlockRegex.exec(body)) !== null) {
      const lang = match[1] || "plaintext";
      const code = match[2].trim();
      const html = await highlightCode(code, lang);
      replacements.push({ original: match[0], html, lang, code });
    }

    // Replace code blocks with a special marker for client rendering
    for (let i = 0; i < replacements.length; i++) {
      const r = replacements[i];
      const marker = `<!--CODEBLOCK:${i}:${r.lang}-->`;
      body = body.replace(r.original, marker);
    }

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    sections.push({
      id,
      title,
      content: body,
    });
  }

  return sections;
}

async function getHighlightedSections(content: string) {
  // Extract all code blocks and highlight them
  const codeBlocks: Array<{ lang: string; code: string; html: string }> = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let processedContent = content;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const lang = match[1] || "plaintext";
    const code = match[2].trim();
    const html = await highlightCode(code, lang);
    codeBlocks.push({ lang, code, html });
  }

  // Replace code blocks with markers
  let blockIndex = 0;
  processedContent = content.replace(codeBlockRegex, () => {
    const marker = `__CODEBLOCK_${blockIndex}__`;
    blockIndex++;
    return marker;
  });

  // Split into sections by ## heading
  const rawSections = processedContent.split(/^## /m).filter((s) => s.trim());
  const sections = rawSections.map((section) => {
    const lines = section.split("\n");
    const title = lines[0].trim();
    const body = lines.slice(1).join("\n").trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return { id, title, body };
  });

  return { sections, codeBlocks };
}

export default async function MachineWalkthroughPage({ params }: PageProps) {
  const { slug } = await params;
  const machine = getMachineBySlug(slug);

  if (!machine) {
    notFound();
  }

  const { metadata, content } = machine;
  const { sections, codeBlocks } = await getHighlightedSections(content);

  return (
    <div className="relative min-h-screen">
      <FloatingNav />

      <WalkthroughContent
        metadata={metadata}
        sections={sections}
        codeBlocks={codeBlocks}
      />
    </div>
  );
}
