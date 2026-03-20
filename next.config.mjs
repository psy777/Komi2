/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                jschardet: false,
                'iconv-lite': false,
            };
        }
        return config;
    },
    turbopack: {},
};

export default nextConfig;
