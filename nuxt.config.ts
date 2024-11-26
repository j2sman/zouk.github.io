// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // app: {
  //   baseURL: "/zouk.github.io/", // GitHub 저장소 이름으로 변경
  //   buildAssetsDir: "assets",
  //   // CDN 사용시 필요한 설정
  //   cdnURL: "https://j2sman.github.io",
  // },
  ssr: true,
  target: "static",
  image: {
    domains: ["i.imgur.com", "images.socialdance.kr"], // 외부 이미지 도메인 허용
  },
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxtjs/i18n",
    "@vueuse/nuxt",
    "@nuxtjs/supabase",
    "@pinia/nuxt",
  ],
  extends: ["@nuxt/ui-pro"],
  routeRules: {
    // Temporary workaround for prerender regression. see https://github.com/nuxt/nuxt/issues/27490
    "/": { prerender: true },
  },
  devtools: {
    enabled: true,
  },
  future: {
    compatibilityVersion: 4,
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },

  compatibilityDate: "2024-07-11",

  i18n: {
    langDir: "./locales",
    locales: [
      { code: "ko", name: "한국어", file: "ko.json" },
      { code: "en", name: "English", file: "en.json" },
    ],
    defaultLocale: "ko",
    skipSettingLocaleOnNavigate: true,
  },
  supabase: {
    // Supabase 관련 설정
    redirect: false,
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
    },
  },
  nitro: {
    routeRules: {
      "/**": {
        headers: {
          "Content-Security-Policy":
            "frame-ancestors 'self' https://calendar.google.com/ https://www.instagram.com/",
          "Access-Control-Allow-Origin": "https://www.instagram.com",
        },
      },
      "/api/**": {
        cors: true,
        proxy: { fetch: { credentials: "include" } },
      },
    },
  },
});
