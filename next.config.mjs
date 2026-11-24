import os from 'node:os';

function getLanDevOrigins() {
  const hosts = new Set(['127.0.0.1', '172.16.0.2']);
  try {
    const nets = os.networkInterfaces();
    for (const entries of Object.values(nets)) {
      for (const info of entries || []) {
        if (info.family === 'IPv4' && !info.internal && info.address) {
          hosts.add(info.address);
        }
      }
    }
  } catch {}
  return [...hosts];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: getLanDevOrigins(),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: 'img.ptscreens.com' },
      { protocol: 'https', hostname: 'img.ptscreen.com' },
      { protocol: 'https', hostname: 'ptscreens.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'i.ibb.co.com' },
      { protocol: 'https', hostname: 'shared.akamai.steamstatic.com' }
    ]
  }
};

export default nextConfig;
