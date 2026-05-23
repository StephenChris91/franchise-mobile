/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@franchise/auth",
    "@franchise/db",
    "@franchise/types",
    "@franchise/validators",
    "@franchise/api-client",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
