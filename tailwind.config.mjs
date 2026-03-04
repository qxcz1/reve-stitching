// tailwind.config.mjs — Custom theme for Reve Stitching
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#166534',
          light: '#22c55e',
          dark: '#14532d',
        },
        accent: '#15803d',
        surface: '#f0fdf4',
        border: '#dcfce7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        'display': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'headline': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.15', fontWeight: '700' }],
        'title': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.2', fontWeight: '600' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};