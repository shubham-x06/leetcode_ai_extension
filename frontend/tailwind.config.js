/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        panel: 'var(--panel)',
        border: 'var(--border)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
      },
    },
  },
  plugins: [],
};
