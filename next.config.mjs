/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@clerk/nextjs": require.resolve("./lib/clerk-compat.tsx"),
      "@clerk/nextjs/server": require.resolve("./lib/clerk-server-compat.ts"),
    }
    return config
  },
}

export default nextConfig
