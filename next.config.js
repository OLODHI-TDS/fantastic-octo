/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Externalize pdfkit to use Node.js modules directly with all assets
  serverExternalPackages: ['pdfkit'],
}

module.exports = nextConfig
