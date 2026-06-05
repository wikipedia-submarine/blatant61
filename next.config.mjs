/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // Disable Turbopack's persistent disk cache — prevents SST file corruption
  // on Windows (known turbo-tasks-backend bug with concurrent write batches).
  experimental: {
    turbo: {
      memoryLimit: 512 * 1024 * 1024, // 512 MB in-memory limit
    },
  },
}

export default nextConfig
