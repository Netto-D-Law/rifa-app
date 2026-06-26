import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        rotary: {
          blue: '#17458F',
          blueDark: '#0E2E61',
          bluePale: '#E7EDF7',
          gold: '#F7A81B',
          goldDark: '#B97800',
          green: '#3C6E47',
          greenPale: '#E4EFE7',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
