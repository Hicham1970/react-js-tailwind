/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // C'est la ligne la plus importante. Elle active le mode sombre.
  theme: {
    extend: {},
  },
  plugins: [],
}