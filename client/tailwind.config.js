/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',   // Pale blue/gray
          100: '#f1f5f9',  // Very light cool-toned
          200: '#e2e8f0',  // Light gray
          300: '#cbd5e1',  // Medium light gray
          400: '#94a3b8',  // Medium gray
          500: '#64748b',  // Neutral gray
          600: '#475569',  // Medium dark gray
          700: '#334155',  // Dark gray
          800: '#1e293b',  // Charcoal dark gray
          900: '#0f172a',  // Very dark gray
        },
        accent: {
          50: '#fef7ed',   // Very light warm
          100: '#fdedd5',  // Light warm
          200: '#fbd7aa',  // Light tan
          300: '#f8c174',  // Muted orange
          400: '#f4a74c',  // Warm orange
          500: '#f08d24',  // Muted orange
          600: '#e67e22',  // Orange
          700: '#d97706',  // Darker orange
          800: '#b45309',  // Dark orange
          900: '#92400e',  // Very dark orange
        },
        teal: {
          50: '#f0fdfa',   // Very light teal
          100: '#ccfbf1',  // Light teal
          200: '#99f6e4',  // Muted teal
          300: '#5eead4',  // Medium teal
          400: '#2dd4bf',  // Teal
          500: '#14b8a6',  // Muted blue/teal
          600: '#0d9488',  // Dark teal
          700: '#0f766e',  // Darker teal
          800: '#115e59',  // Very dark teal
          900: '#134e4a',  // Dark teal/navy
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0a0a0a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
