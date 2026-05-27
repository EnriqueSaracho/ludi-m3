import type { NextConfig } from "next";

const devWatchIgnored = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.next/**",
  "**/.cursor/**",
  "**/.agents/**",
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.igdb.com",
        pathname: "/igdb/image/upload/**",
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: devWatchIgnored,
      };
    }
    return config;
  },
};

export default nextConfig;
