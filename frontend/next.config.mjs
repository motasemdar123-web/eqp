/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingExcludes: {
    '*': [
      'public/audio/**',
      'public/images/**',
    ],
  },
};

export default nextConfig;
