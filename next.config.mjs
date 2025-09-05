/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required headers for FFmpeg.js to work in browsers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
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
    }
    
    return config
  }
};

export default nextConfig;
