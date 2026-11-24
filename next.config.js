/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // sharp is a native image library; keep it out of the bundler.
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  async redirects() {
    return [
      { source: '/products', destination: '/browse', permanent: true },
      { source: '/product', destination: '/browse', permanent: true },
      { source: '/shop', destination: '/browse', permanent: true },
      { source: '/catalog', destination: '/browse', permanent: true },
      { source: '/gallery', destination: '/browse', permanent: true },
      { source: '/items', destination: '/browse', permanent: true },
      { source: '/artworks', destination: '/browse', permanent: true },
      { source: '/cart', destination: '/browse', permanent: true },
      { source: '/dashboard/ai-studio', destination: '/create/fusion', permanent: true },
      { source: '/ai-studio', destination: '/create/fusion', permanent: true },
      { source: '/fusion', destination: '/create/fusion', permanent: true },
      { source: '/upload', destination: '/dashboard/upload', permanent: true },
      { source: '/billing', destination: '/dashboard/billing', permanent: true },
      { source: '/payouts', destination: '/dashboard/payouts', permanent: true },
    ];
  },
};

module.exports = nextConfig;
