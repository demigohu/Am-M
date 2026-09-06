/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  transpilePackages: ["@altananetwork/sdk", "porto", "ox"],
  async redirects() {
    return [
      {
        source: "/desks/:slug",
        destination: "/market?desk=:slug",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
