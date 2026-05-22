import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E5442D',
          light:   '#FEF0ED',
          dark:    '#B83520',
        },
      },
      width:  { sidebar: '252px' },
      margin: { sidebar: '252px' },
    },
  },
  plugins: [],
};

export default config;
