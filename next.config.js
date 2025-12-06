const withPWA = require('next-pwa')({
  dest: 'public',
  disable: false,
  register: true,
  skipWaiting: true,
  scope: '/',
  fallbacks: { document: '/_offline' }
})

module.exports = withPWA({
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' }
        ]
      }
    ]
  }
})
