import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
<<<<<<< HEAD
    ignoreBuildErrors: true,
=======
    // ignoreBuildErrors: true, // Temporarily removed to surface underlying type errors
>>>>>>> master
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
};

export default nextConfig;
