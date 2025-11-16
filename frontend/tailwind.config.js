// Make sure to import the default theme if you're extending
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Make sure this matches your project
  ],
  theme: {
    extend: {
      // Add your font family here
      fontFamily: {
        sans: ['Roboto', ...defaultTheme.fontFamily.sans],
        // You could also add it as a custom name, e.g.:
        // 'roboto': ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}