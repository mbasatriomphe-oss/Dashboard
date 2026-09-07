/**
 * next.config.js
 * Proxy all /api/* requests to the Laravel backend on Render.
 * Required for production on Vercel.
 */

const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tutore3latest.onrender.com'

module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backend.replace(/\/api\/?$/, '').replace(/\/$/, '')}/api/:path*`,
      },
    ]
  },
}
