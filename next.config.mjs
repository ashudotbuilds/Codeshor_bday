const privatePageHeaders = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  { key: 'CDN-Cache-Control', value: 'no-store' },
  { key: 'Referrer-Policy', value: 'no-referrer' }
];

export default {
  async headers() {
    return ['/organizer/:path*', '/invite/:path*', '/birthday/:path*'].map(source => ({
      source,
      headers: privatePageHeaders
    }));
  }
};
