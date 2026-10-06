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
          50: '#EEF3FF',
          100: '#DCE6FF',
          200: '#B8C9FF',
          300: '#88A7FF',
          400: '#5E7EFF',
          500: '#3F5EF5',
          600: '#2947D9',
          700: '#2139AF',
          800: '#192D82',
          900: '#101D57',
        },
        saffron: {
          50: '#F7FFE8',
          100: '#ECFFD0',
          200: '#D9FFA2',
          300: '#C7FF6B',
          400: '#A7E94E',
          500: '#82BE31',
          600: '#639421',
          700: '#4A7017',
          800: '#365112',
        },
        govBg: '#F4F6FC',
        govText: {
          primary: '#172039',
          secondary: '#66708A',
          muted: '#929BB0',
          border: '#DCE2F0',
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
