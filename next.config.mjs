/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  env: {
    // NVIDIA NIM API
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
    // Openwork Platform
    OPENWORK_API_KEY: process.env.OPENWORK_API_KEY,
    OPENWORK_AGENT_ID: process.env.OPENWORK_AGENT_ID,
    // Squadron Agent Keys
    BACKEND_API_KEY: process.env.BACKEND_API_KEY,
    BACKEND_AGENT_ID: process.env.BACKEND_AGENT_ID,
    CONTRACT_API_KEY: process.env.CONTRACT_API_KEY,
    CONTRACT_AGENT_ID: process.env.CONTRACT_AGENT_ID,
    FRONTEND_API_KEY: process.env.FRONTEND_API_KEY,
    FRONTEND_AGENT_ID: process.env.FRONTEND_AGENT_ID,
    PM_API_KEY: process.env.PM_API_KEY,
    PM_AGENT_ID: process.env.PM_AGENT_ID,
    // Base Network
    BASE_RPC_URL: process.env.BASE_RPC_URL,
    TREASURY_WALLET_ADDRESS: process.env.TREASURY_WALLET_ADDRESS,
    // App URL (for internal API calls)
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL,
  },
};

export default nextConfig;
