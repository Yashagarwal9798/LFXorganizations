/** @type {import('next').NextConfig} */

if (
  process.env.NODE_ENV === 'production' &&
  !global.__healthPingStarted
) {
  global.__healthPingStarted = true;
  console.log('[Health Ping] Starting ping interval every 5 minutes...');
  setInterval(() => {
    const url = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
    fetch(`${url}/health`)
      .then((res) => console.log(`[Health Ping] Status: ${res.status}`))
      .catch((err) => console.error(`[Health Ping] Error:`, err.message));
  }, 5 * 60 * 1000); // 5 minutes
}

const nextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
