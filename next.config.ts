import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Allow cross-origin requests from specific development origins
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1748517295240.cluster-ys234awlzbhwoxmkkse6qo3fz6.cloudworkstations.dev',
      // You might need to add other origins if you access your dev server from different preview URLs
    ],
  },
  // If using next-themes, and it causes issues with server components or build:
  // experimental: {
  //   serverComponentsExternalPackages: ['@radix-ui/*'], // Example
  // },
  // transpilePackages: ['next-themes'], // Example if next-themes needs transpilation
};

export default nextConfig;
