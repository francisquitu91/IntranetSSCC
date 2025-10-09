import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#0F4C81',
          light: '#EFF7FB',
          dark: '#0C365A',
        },
      },
      boxShadow: {
        card: '0 15px 35px -20px rgba(15, 76, 129, 0.4)',
      },
    },
  },
  plugins: [],
}

export default config
