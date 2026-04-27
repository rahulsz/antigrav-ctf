import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import { getAllMachines } from "@/lib/machines";
import "./globals.css";

const StarfieldWrapper = dynamic(() => import("@/components/three/starfield-wrapper").then(mod => mod.StarfieldWrapper));
const CommandPalette = dynamic(() => import("@/components/command-palette").then(mod => mod.CommandPalette));

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RahulCyberX // Breach Protocol",
    template: "%s | RahulCyberX",
  },
  description:
    "A high-end CTF walkthrough platform. Deep-space forensic interface for security researchers.",
  keywords: ["CTF", "cybersecurity", "penetration testing", "walkthrough", "HackTheBox"],
  authors: [{ name: "RahulCyberX" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const machines = getAllMachines();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased relative`}
    >
      <body className="min-h-full flex flex-col relative">
        {/* 3D Starfield background */}
        <StarfieldWrapper />

        {/* Global Command Palette */}
        <CommandPalette machines={machines} />

        {/* Main content */}
        <main className="relative z-10 flex-1">{children}</main>
      </body>
    </html>
  );
}
