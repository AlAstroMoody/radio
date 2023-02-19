/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    colors: {
      blue: {
        100: '#98b3cf', // основной цвет текста
        200: '#009bf3', // ховер основного текста
      },
      light: {
        100: '#eef7ff', // светлый бэкграунд
        200: '#e2effd', // второстепенный светлый бэкграунд
      },
      dark: {
        100: '#0e1a2c', // тёмный бэкграунд
        200: '#1a385b', // второстепенный тёмный бэкграунд
      },
      white: '#fffffF',
      black: '#2f353d',
    },
    extend: {
      boxShadow: {
        button: '0px 0px 5px rgba(206, 206, 206, 0.5)',
      },
    },
  },
  plugins: [],
}
