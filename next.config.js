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
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'zeuschat.zeustechafrica.com' }],
        destination: 'https://zeuschat.zeustechafrica.com/',
        permanent: true,
      }
    ]
  },
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
