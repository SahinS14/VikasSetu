/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govTeal: {
          50: '#F0F0FF', 100: '#E1E0FF', 200: '#C8C7FF', 300: '#A7A5FF',
          400: '#8683F7', 500: '#6865D9', 600: '#504CB8', 700: '#403C95',
          800: '#302D70', 900: '#201E4D',
        },
        saffron: {
          50: '#FFF0F2', 100: '#FFDDE1', 200: '#FFC2CA', 300: '#FF9AA7',
          400: '#F76C7D', 500: '#E34D63', 600: '#C73750', 700: '#9F2941', 800: '#762033',
        },
        govBg: '#F7F6FF',
        govText: {
          primary: '#23213B', secondary: '#625F7D', muted: '#9290AA', border: '#E1E0EF',
        },
        govSuccess: '#2E8B57',
        govWarning: '#D9822B',
        govError: '#C0392B',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
