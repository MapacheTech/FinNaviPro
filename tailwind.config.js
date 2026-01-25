/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Inter', 'sans-serif'],
      },
      colors: {
        background: '#09090b', // Zinc 950
        surface: '#18181b', // Zinc 900
        surfaceHighlight: '#27272a', // Zinc 800
        primary: '#13ec13', // Neon Green
        primaryDim: '#0f8a0f',
        secondary: '#7f0df2', // Neon Purple
        accent: '#f472b6',
        text: '#ffffff',
        textMuted: '#a1a1aa',
      },
      boxShadow: {
        'neon-green': '0 0 10px rgba(19, 236, 19, 0.5), 0 0 20px rgba(19, 236, 19, 0.3)',
        'neon-purple': '0 0 10px rgba(127, 13, 242, 0.5), 0 0 20px rgba(127, 13, 242, 0.3)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
