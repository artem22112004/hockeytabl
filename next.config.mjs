/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.nhle.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cms.nhl.bamgrid.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
