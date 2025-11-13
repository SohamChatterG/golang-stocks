/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#0ea5e9',
                    accent: '#22c55e',
                    purple: '#7c3aed',
                }
            }
        },
    },
    plugins: [],
}
