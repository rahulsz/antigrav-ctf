import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server-side external packages for Shiki
  serverExternalPackages: ["shiki"],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@react-three/fiber", "three"],
  },
};

export default nextConfig;
