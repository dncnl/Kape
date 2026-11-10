import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components stays off so `/` can use `export const revalidate = 60`
  // (route segment config is removed when cacheComponents is on).
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
