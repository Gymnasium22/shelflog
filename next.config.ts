import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const revision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  additionalPrecacheEntries: [{ url: "/offline", revision }],
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default withSerwist(nextConfig);
