/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
    // Root tsconfig.json now belongs to Astro. The legacy Next.js app (kept only
    // until M0 baselines are captured) uses its own frozen tsconfig.
    tsconfigPath: 'tsconfig.next.json',
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
