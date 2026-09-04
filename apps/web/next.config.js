/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  transpilePackages: ["@altananetwork/sdk", "porto", "ox"],
};

export default nextConfig;
