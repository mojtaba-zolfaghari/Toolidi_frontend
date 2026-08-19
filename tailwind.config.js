const defaultTheme = require('tailwindcss/defaultConfig');
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C3FC5',
        'primary-dark': '#5331A0',
        'primary-light': '#8B6AD8',
        secondary: '#1B2A4A',
        'secondary-light': '#2A3F6B',
        'accent-success': '#059669',
        'accent-warning': '#D97706',
        'accent-danger': '#DC2626',
        'accent-info': '#2563EB',
        'gold': '#D4AF37',
        'gold-light': '#E8CF7A',
        'gold-dark': '#B8962E',
        'bg-warm': '#FBFAF8',
        'bg-panel': '#FAF8F5',
        'bg-card': '#FFFFFF',
        'bg-muted': '#F3F0FF',
      },
      fontFamily: {
        vazirmatn: ['Vazirmatn', 'sans-serif'],
      },
      // RTL-aware spacing via logical properties
      margin: {
        'start-auto': 'auto',
        'end-auto': 'auto',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(108, 63, 197, 0.15)',
      },
    },
  },
  plugins: [
    // RTL variant — adds `rtl:` and `ltr:` prefixes for direction-aware styling
    // Tailwind v3 has these built-in, but we register them explicitly for clarity
    plugin(function({ addVariant, addBase, theme }) {
      addVariant('rtl', '&[dir="rtl"]');
      addVariant('ltr', '&[dir="ltr"]');

      // Global base: apply Vazirmatn font to the html element
      addBase({
        html: { fontFamily: theme('fontFamily.vazirmatn') },
      });
    }),
  ],
};
