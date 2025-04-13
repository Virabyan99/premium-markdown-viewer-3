import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        kr: ['"Noto Sans KR"', 'sans-serif'],
        jp: ['"Noto Sans JP"', 'sans-serif'],
        sc: ['"Noto Sans SC"', 'sans-serif'],
        sans: ['Geist', 'sans-serif'], // Default font
      },
    },
  },
  plugins: [],
} satisfies Config;