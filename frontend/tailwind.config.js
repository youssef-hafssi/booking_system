/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        primary: {
          DEFAULT: "hsl(var(--background-primary))",
          foreground: "hsl(var(--foreground-primary))",
        },
        secondary: {
          DEFAULT: "hsl(var(--background-secondary))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent-primary))",
          secondary: "hsl(var(--accent-secondary))",
          yellow: "#FFCB14",
        },
        brand: {
          primary: "#412977",
          hover: "#2F1F56",
          light: "#523993",
          lighter: "#8B7AAF",
        },
        dark: {
          background: "#1C1C1C",
          card: "#252525",
          sidebar: "#121212",
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
} 