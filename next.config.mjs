import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      "@clerk/nextjs": path.resolve(process.cwd(), "lib/clerk-compat.tsx"),
      "@clerk/nextjs/server": path.resolve(process.cwd(), "lib/clerk-server-compat.ts"),
    },
  },
}

export default nextConfig
