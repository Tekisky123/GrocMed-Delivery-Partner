/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F8800E',
          light: '#FAA353',
          dark: '#A7461B',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#63B041',
          light: '#85C866',
          dark: '#2C691D',
          foreground: '#FFFFFF',
        },
        background: '#F8F9FA',
        surface: '#FFFFFF',
      },
    }
  },
  plugins: []
}
