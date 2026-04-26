import type { MetadataRoute } from "next";
import { getMachineParams } from "@/lib/machines";

const BASE_URL = "https://rahulcyberx.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const machineParams = getMachineParams();

  const machineRoutes = machineParams.map((p) => ({
    url: `${BASE_URL}/machines/${p.platform}/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/machines`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/platforms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...machineRoutes,
  ];
}
