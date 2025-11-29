/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Enable class-based dark mode
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Map Tailwind colors to CSS variables
                primary: {
                    DEFAULT: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                },
                accent: {
                    DEFAULT: 'var(--accent-primary)',
                    hover: 'var(--accent-hover)',
                }
            },
        },
    },
    plugins: [],
}
