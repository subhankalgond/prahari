/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        canvas: '#FAF9F5',
        ink: {
          900: '#1C1917',
          600: '#57534E',
          400: '#A8A29E',
        },
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(28 25 23 / 0.05), 0 1px 3px 0 rgb(28 25 23 / 0.06)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};
