// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    optimizeDeps: {
      include: ['video.js'],
    },
  },

  app: {
    head: {
      title: 'Vider Player – Watch Movies & Videos',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Vider Player – a sleek Nuxt-powered player for vider.info videos. Paste a vider.info link and enjoy your movie.',
        },
        { name: 'theme-color', content: '#0f0f14' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  routeRules: {
    '/**': { headers: { 'X-Frame-Options': 'SAMEORIGIN' } },
  },
})
