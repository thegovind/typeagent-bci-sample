/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_AZURE_MAPS_SUBSCRIPTION_KEY: process.env.NEXT_PUBLIC_AZURE_MAPS_SUBSCRIPTION_KEY,
  },
  // Add any other Next.js config options here
}

module.exports = nextConfig 