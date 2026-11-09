import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactCompiler: true, // desabilitado — causa erro de useContext no prerender de /_global-error

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Permitir imagens do Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Substitua pelo seu Project ID do Supabase
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.com",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
