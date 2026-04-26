import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server-side external packages for Shiki
  serverExternalPackages: ["shiki"],

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@react-three/fiber",
      "@react-three/drei",
      "three",
      "cmdk",
    ],
  },

  // Compress responses
  compress: true,

  // Power content-based hashing for long-term caching
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
