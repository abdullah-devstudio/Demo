/* Tailwind CDN configuration — Abdullah Dev Studio brand tokens.
   Loaded as a classic script right after the Tailwind CDN script. */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        txt: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        accenth: 'rgb(var(--c-accent-hover) / <alpha-value>)',
        line: 'rgb(var(--c-border) / <alpha-value>)',
        info: 'rgb(var(--c-info) / <alpha-value>)',
      },
    },
  },
};
