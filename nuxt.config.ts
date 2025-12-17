// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'vi' },
      title: 'EVN Prices'
    }
  },
  devtools: { enabled: true }
})
