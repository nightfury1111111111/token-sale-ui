/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./publicindex.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            backgroundImage: {
                'bg-picture': "url('/public/bg.png')"
            }
        },
    },
    plugins: [],
    important: true,
};