/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#1DB954',
          blue: '#1a73e8',
          red: '#ff2056',
          dark: '#121212',
          darkcard: '#1e1e1e',
          darksidebar: '#181818',
        },
      },
      backgroundImage: {
        'hero-dark': 'linear-gradient(135deg, #0d2137 0%, #143d2f 60%, #1a2d1a 100%)',
        'hero-light': 'linear-gradient(135deg, #e0f4ff 0%, #c8f0e0 60%, #e8f5e9 100%)',
      },
      keyframes: {
        eq: {
          '0%, 100%': { height: '4px' },
          '50%': { height: '14px' },
        },
      },
      animation: {
        eq1: 'eq 0.8s ease-in-out infinite',
        eq2: 'eq 0.8s ease-in-out infinite 0.2s',
        eq3: 'eq 0.8s ease-in-out infinite 0.4s',
      },
    },
  },
  plugins: [],
}
