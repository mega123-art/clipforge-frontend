/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        creator: {
          // Soft-UI evolution palette (UI/UX Pro Max recommendation)
          DEFAULT: '#EC4899',  // primary creator pink
          light:   '#F472B6',  // secondary
          cta:     '#F97316',  // CTA orange
          bg:      '#FDF2F8',  // light bg
          ink:     '#831843',  // dark text
        },
        forge: {
          bg:             'rgb(var(--c-bg) / <alpha-value>)',
          surface:        'rgb(var(--c-surface) / <alpha-value>)',
          card:           'rgb(var(--c-card) / <alpha-value>)',
          'card-hover':   'rgb(var(--c-card-hover) / <alpha-value>)',
          border:         'rgb(var(--c-border) / <alpha-value>)',
          'border-bright':'rgb(var(--c-border-bright) / <alpha-value>)',
          accent:         'rgb(var(--c-accent) / <alpha-value>)',
          'accent-light': 'rgb(var(--c-accent-light) / <alpha-value>)',
          gold:           'rgb(var(--c-gold) / <alpha-value>)',
          cyan:           'rgb(var(--c-cyan) / <alpha-value>)',
          rose:           'rgb(var(--c-rose) / <alpha-value>)',
          muted:          'rgb(var(--c-muted) / <alpha-value>)',
          dim:            'rgb(var(--c-dim) / <alpha-value>)',
          text:           'rgb(var(--c-text) / <alpha-value>)',
          subtext:        'rgb(var(--c-subtext) / <alpha-value>)',
        },
      },
      boxShadow: {
        'glow-violet':     '0 0 25px rgba(139, 92, 246, 0.45), 0 0 70px rgba(139, 92, 246, 0.18)',
        'glow-violet-sm':  '0 0 14px rgba(139, 92, 246, 0.50)',
        'glow-violet-lg':  '0 0 50px rgba(139, 92, 246, 0.60), 0 0 100px rgba(139, 92, 246, 0.25)',
        'glow-gold':       '0 0 22px rgba(245, 158, 11, 0.35)',
        'glow-cyan':       '0 0 20px rgba(34, 211, 238, 0.35)',
        'card':            '0 4px 30px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.05) inset',
        'card-hover':      '0 12px 50px rgba(0,0,0,0.85), 0 0 0 1px rgba(139,92,246,0.2)',
        'card-light':      '0 2px 20px rgba(90,55,200,0.10), 0 1px 0 rgba(255,255,255,1) inset',
        'card-light-hover':'0 10px 40px rgba(90,55,200,0.18)',
        'inner-top':       'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'fade-up':      'fadeUp 0.5s ease-out forwards',
        'fade-in':      'fadeIn 0.4s ease-out forwards',
        'shimmer':      'shimmer 2.5s infinite',
        'float':        'float 6s ease-in-out infinite',
        'float-slow':   'float 9s ease-in-out infinite',
        'glow-pulse':   'glow-pulse 2.2s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
        'bounce-dots':  'bounceDots 0.9s ease-in-out infinite',
        'aurora-drift': 'aurora-drift 18s ease-in-out infinite alternate',
        'pulse-ring':   'pulse-ring 1.8s ease-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139,92,246,0.35)' },
          '50%':      { boxShadow: '0 0 45px rgba(139,92,246,0.65), 0 0 90px rgba(139,92,246,0.20)' },
        },
        bounceDots: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        'aurora-drift': {
          '0%':   { transform: 'scale(1) translateY(0px)',    opacity: '1' },
          '33%':  { transform: 'scale(1.05) translateY(-18px)', opacity: '0.85' },
          '66%':  { transform: 'scale(0.97) translateY(12px)', opacity: '0.90' },
          '100%': { transform: 'scale(1.02) translateY(-6px)', opacity: '0.95' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)',   opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
