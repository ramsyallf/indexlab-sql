/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        fill: { DEFAULT: '#F1F5F9', strong: '#E2E8F0' },
        ink: { DEFAULT: '#0F172A', 2: '#475569', 3: '#94A3B8' },
        line: { DEFAULT: '#CBD5E1', soft: '#E2E8F0' },
        accent: { DEFAULT: '#2563EB', hover: '#1D4ED8', soft: '#EFF6FF' },
        ok: { DEFAULT: '#059669', fill: '#10B981', soft: '#ECFDF5' },
        warn: { DEFAULT: '#D97706', fill: '#F59E0B', soft: '#FFFBEB' },
        bad: { DEFAULT: '#E11D48', fill: '#F43F5E', soft: '#FFF1F2' },
        indigo: { DEFAULT: '#6366F1', soft: '#EEF2FF' },
        teal: { DEFAULT: '#06B6D4', soft: '#ECFEFF' },
        purple: { DEFAULT: '#8B5CF6', soft: '#F5F3FF' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '22px',
        field: '12px',
        hero: '28px',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'glow-accent': '0 8px 25px -4px rgba(37, 99, 235, 0.35)',
        'glow-indigo': '0 8px 25px -4px rgba(99, 102, 241, 0.35)',
        'glow-ok': '0 8px 25px -4px rgba(16, 185, 129, 0.35)',
        lift: '0 12px 36px -4px rgba(15, 23, 42, 0.10), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
