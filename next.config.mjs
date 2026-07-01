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
      "@clerk/nextjs": "./lib/clerk-compat.tsx",
      "@clerk/nextjs/server": "./lib/clerk-server-compat.ts",
    },
  },
}

export default nextConfig
