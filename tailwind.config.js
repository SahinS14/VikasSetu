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
          50: '#EAF6F1',
          100: '#D5EDDF',
          200: '#ACDCBF',
          300: '#83CA9F',
          400: '#34A868',
          500: '#148C58',
          600: '#0B6E4F', // Primary Gov Teal
          700: '#08553D',
          800: '#053C2B',
          900: '#032319',
        },
        saffron: {
          50: '#FDF6ED',
          100: '#FBECDA',
          200: '#F7DAB5',
          300: '#F3C790',
          400: '#EEA247',
          500: '#E68A2E', // Accent Saffron
          600: '#C76F1D',
          700: '#9B5414',
          800: '#6F3A0B',
        },
        govBg: '#F7F5F0', // Civic off-white
        govText: {
          primary: '#1E2523',
          secondary: '#5B6660',
          muted: '#8A9791',
          border: '#DCE4DF',
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
