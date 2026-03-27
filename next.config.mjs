/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ["tesseract.js", "canvas"]
  }
};

export default nextConfig;
