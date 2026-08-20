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
      // YouTube poster frames for the trailers in the game-page media rail.
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
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
