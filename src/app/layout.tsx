import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { StarfieldWrapper } from "@/components/three/starfield-wrapper";
import "./globals.css";

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
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        {/* 3D Starfield background */}
        <StarfieldWrapper />

        {/* Main content */}
        <main className="relative z-10 flex-1">{children}</main>
      </body>
    </html>
  );
}
