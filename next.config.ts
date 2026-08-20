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
    /* Next 16 narrowed the default to `[75]` and rejects anything unlisted, so
       every quality used anywhere has to be declared here. 60 is for the two
       hero backdrops: they sit under a scrim with type over them, where the
       detail a higher quality buys is never visible, and at 3840px wide the
       byte difference is worth more than the fidelity. */
    qualities: [60, 75],
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
