/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output only for Docker builds (set NEXT_BUILD_STANDALONE=true in Dockerfile)
  ...(process.env.NEXT_BUILD_STANDALONE === 'true' ? { output: 'standalone' } : {}),
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
    : [],
};

export default nextConfig;
