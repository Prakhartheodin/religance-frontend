
/**@type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const nextConfig = {
  output: "export",
  // Pin the workspace root to this project — a stray package-lock.json in the
  // home dir was making the bundler watch/resolve across all of C:\Users\INTEL.
  turbopack: { root: __dirname },
  reactStrictMode: true,
  trailingSlash: true,
basePath: "",
	assetPrefix : "",
  images: {
    loader: "imgix",
    path: "/",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
