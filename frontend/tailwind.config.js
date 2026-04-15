/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xl: "1100px",
        xxl: "1300px",
      },
      colors: {
        // Figma mockup uses different blue
        // "ucsd-blue": "#00629B",
        "ucsd-blue": "#0E7395",
        "ucsd-darkblue": "#182B49",
        "ucsd-gold": "#FFCD00",
        "default-bg": "#FFFFFF",
        "default-teal": "#57DBCE",
        "default-gray": "#D9D9D9",
      },
      fontFamily: {
        jetbrains: ["JetBrains Mono", "monospace"],
        inter: ["Inter", "sans-serif"],
        rubik: ["Rubik", "sans-serif"],
      },
    },
  },
  plugins: [],
};
