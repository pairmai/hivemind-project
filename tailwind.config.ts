import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          100: "#D9D9D9",
          200: "#B3B3B3",
          300: "#8C8A8A",
          400: "#616161",
          500: "#1F2937",
          600: "#000000",
        },
        blue: "#2C87F2",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
    fontSize: {
      'xs': '.75rem',
      'sm': '.850rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.850rem',
    },
  }, 
  plugins: [],
} satisfies Config;
