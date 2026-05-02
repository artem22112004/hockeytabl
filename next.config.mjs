/** @type {import('next').NextConfig} */
const nextConfig = {
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
