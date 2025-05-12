import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  distDir: 'out',
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.openfoodfacts.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.openfoodfacts.org',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
