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
  // If using next-themes, and it causes issues with server components or build:
  // experimental: {
  //   serverComponentsExternalPackages: ['@radix-ui/*'], // Example
  // },
  // transpilePackages: ['next-themes'], // Example if next-themes needs transpilation
};

export default nextConfig;
