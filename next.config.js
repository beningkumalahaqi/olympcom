/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tprawzwjfpddkgwxhotm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Cache images for better performance
    minimumCacheTTL: 3600, // 1 hour
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers configuration
  async headers() {
    return [
      // Headers required for FFmpeg.js (SharedArrayBuffer support) - using credentialless for compatibility
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ]
      },
      // Cache headers for media files from Supabase
      {
        source: '/storage/v1/object/public/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable' // 1 year cache
          }
        ]
      }
    ]
  },
  
  // Webpack configuration to handle FFmpeg.js dependencies
  webpack: (config, { dev, isServer }) => {
    // Handle FFmpeg.js in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
      
      // Ensure proper handling of SharedArrayBuffer for FFmpeg.js
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      }
    }
    
    return config
  },
}

module.exports = nextConfig
