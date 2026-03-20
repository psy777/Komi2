import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Inter', 'sans-serif'],
                google: ['Google Sans', 'DM Sans', 'sans-serif'],
            },
            colors: {
                wood: {
                    100: '#f7e9c8',
                    200: '#eddca8',
                    300: '#e3c886',
                    400: '#d4b060',
                    500: '#c29740',
                    600: '#a67b30',
                    700: '#8a6225',
                    800: '#704e22',
                    900: '#452f14',
                },
                slate: {
                    850: '#151e2e',
                }
            },
            boxShadow: {
                'stone-black': '2px 2px 4px rgba(0, 0, 0, 0.6), inset 2px 2px 6px rgba(255, 255, 255, 0.1), inset -2px -2px 6px rgba(0, 0, 0, 0.6)',
                'stone-white': '2px 2px 4px rgba(0, 0, 0, 0.4), inset 2px 2px 8px rgba(255, 255, 255, 1), inset -2px -2px 6px rgba(0, 0, 0, 0.1)',
            }
        },
    },
    plugins: [],
};
export default config;
