/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jureqncsfmfisakulays.supabase.co", // your Supabase URL
        port: "",
        pathname: "/storage/v1/object/public/user-images/**",
      },
    ],
  },
};

module.exports = nextConfig;
