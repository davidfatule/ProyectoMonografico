/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#347AFF",
          50: "#EBF2FF",
          100: "#D6E5FF",
          500: "#347AFF",
          600: "#2860E6",
        },
        page: "#F5F8FA",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
