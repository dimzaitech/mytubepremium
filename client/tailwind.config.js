/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yt: {
          base: "#0f0f0f",
          main: "#0f0f0f",
          secondary: "#272727",
          text: "#f1f1f1",
          hover: "#3f3f3f",
          red: "#ff0000",
        }
      }
    },
  },
  plugins: [],
}