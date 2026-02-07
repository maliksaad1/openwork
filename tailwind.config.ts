import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './agents/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // NeuraFinity Visual DNA
        neurafinity: {
          // Primary: Deep Navy
          navy: {
            DEFAULT: '#0A192F',
            light: '#112240',
            dark: '#020C1B',
          },
          // Accent: Electric Blue
          electric: {
            DEFAULT: '#64FFDA',
            dim: '#64FFDA80',
            glow: '#64FFDA20',
          },
          // Secondary: Silver-Grey spectrum
          silver: {
            DEFAULT: '#8892B0',
            light: '#CCD6F6',
            dark: '#495670',
          },
          slate: '#112240',
        },
        // Semantic colors
        velocity: {
          high: '#64FFDA',
          medium: '#FFD93D',
          low: '#FF6B6B',
          critical: '#FF4444',
        },
        // Agent status indicators
        agent: {
          active: '#64FFDA',
          idle: '#8892B0',
          error: '#FF6B6B',
          syncing: '#64B5F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['4rem', { lineHeight: '1.1', fontWeight: '700' }],
        'headline': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'subhead': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'cognitive-stream': 'cognitiveStream 3s linear infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(100, 255, 218, 0.3)',
            borderColor: 'rgba(100, 255, 218, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(100, 255, 218, 0.6)',
            borderColor: 'rgba(100, 255, 218, 0.8)',
          },
        },
        cognitiveStream: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cognitive-gradient': 'linear-gradient(90deg, #64FFDA, #64B5F6, #64FFDA)',
        'navy-gradient': 'linear-gradient(180deg, #0A192F 0%, #112240 100%)',
      },
      boxShadow: {
        'electric': '0 0 20px rgba(100, 255, 218, 0.4)',
        'electric-lg': '0 0 40px rgba(100, 255, 218, 0.6)',
        'inner-glow': 'inset 0 0 20px rgba(100, 255, 218, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
