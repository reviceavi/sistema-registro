/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oficial Comisión de Víctimas CDMX
        primary: {
          // Guinda principal
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d0d9',
          300: '#f5aeb8',
          400: '#e5074c',
          500: '#d72f89',
          600: '#9d2148',
          700: '#8f1c3d',
          800: '#7a1835',
          900: '#6b1631',
        },
        dorado: {
          // Dorado institucional
          50: '#fefbf3',
          100: '#fdf4e0',
          200: '#fce8c0',
          300: '#f9d695',
          400: '#f5c468',
          500: '#fdc60a',
          600: '#b28e5c',
          700: '#8b6b3a',
          800: '#755631',
          900: '#5f462a',
        },
        accent: {
          // Colores de apoyo
          naranja: '#f08217',
          verde: '#027a35',
          violeta: '#8F4889',
          rosa: '#f5aeb8',
          amarillo: '#fdc60a',
        },
        // Manteniendo colores neutros para UI
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 15s ease infinite',
      },
      backdropBlur: {
        'xs': '2px',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
