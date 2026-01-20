const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00A3FF',
        secondary: '#18bce9',
        accent: '#0056b3',
        dark: '#0E1636',
        'dark-secondary': '#0d1220',
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(24, 188, 233, 0.3)',
        'glow-lg': '0 0 30px rgba(24, 188, 233, 0.3)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '0.3' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

module.exports = config;
