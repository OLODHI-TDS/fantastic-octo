/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize pdfkit to use Node.js modules directly with all assets
      config.externals = config.externals || []
      config.externals.push('pdfkit')
    }
    return config
  },
}

module.exports = nextConfig
