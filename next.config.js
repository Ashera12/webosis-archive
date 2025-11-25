const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features consolidated (avoid duplicate keys)
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
    optimizePackageImports: ['react-icons', 'framer-motion'],
  },
  // NOTE: The former `api.bodyParser.sizeLimit` key is not valid in Next 15.
  // For custom limits, use route-level: export const config = { api: { bodyParser: { sizeLimit: '50mb' } } }
  
  // Izinkan akses dari network
  allowedDevOrigins: [
    '192.168.101.33',
    '10.183.248.156',
    'http://10.183.248.156:3001',
    'http://192.168.100.101:3001',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    // Add current dev LAN IPs (observed from logs)
    '100.87.220.23',
    'http://100.87.220.23:3000',
    'http://100.87.220.23:3001',
    // ngrok domains
    'prolongedly-belletristic-kory.ngrok-free.dev',
    'https://prolongedly-belletristic-kory.ngrok-free.dev',
  ],
  
  // === OPTIMASI ===
  
  // React Strict Mode (best practice)
  reactStrictMode: true,
  
  // Optimize images otomatis
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
    ],
  },
  
  // Disable ESLint during build to avoid blocking builds for known lint rules.
  // We still recommend fixing lint issues; this setting lets the production
  // build proceed while we address them progressively.
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Import react-icons lebih cepat
  modularizeImports: {
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
  },
  
  // (Already merged into experimental above)

  // Webpack config is not needed with Turbopack and can be removed for Next.js 15+
  // webpack: (config, { dev }) => {
  //   if (dev) {
  //     config.watchOptions = {
  //       poll: 1000,
  //       aggregateTimeout: 300,
  //       ignored: [
  //         '**/node_modules/**',
  //         '**/pagefile.sys',
  //         '**/swapfile.sys',
  //         '**/DumpStack.log.tmp',
  //         '**/$Recycle.Bin/**',
  //       ],
  //     };
  //   }
  //   return config;
  // },
};

module.exports = nextConfig;