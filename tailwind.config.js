/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./publicindex.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            backgroundImage: {
                'bg-picture': "url('/public/bg.png')",
                'linkedin': "url('/public/linkedin.svg')",
                'twitter': "url('/public/twitter.svg')",
                'instagram': "url('/public/instagram.svg')",
                'facebook': "url('/public/facebook.svg')",
            }
        },
    },
    plugins: [],
    important: true,
};
