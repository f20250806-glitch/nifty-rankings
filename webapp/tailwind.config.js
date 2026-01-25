/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-dark': '#0a0f1c',
                'brand-card': '#151b2b',
                'brand-accent': '#3b82f6',
                'brand-success': '#10b981',
                'brand-text': '#e2e8f0',
                'brand-muted': '#94a3b8'
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
