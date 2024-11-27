<script setup>
import { ClubInfoExtService } from "~/database/clubinfo";
import { useClubStore, useClubOptions } from "~/stores/clubstore";
const { clubOptions } = useClubOptions();

const { t, locale, locales, setLocale, finalizePendingLocaleChange } =
  useI18n();
const { copy } = useClipboard();
const toast = useToast();
const switchLocalePath = useSwitchLocalePath();
const clubStore = useClubStore();

const links = computed(() => [
  {
    label: t("nav.schedule"),
    to: locale.value === "ko" ? "/" : `/${locale.value}`,
  },
  {
    label: t("nav.clubInfomap"),
    to: locale.value === "ko" ? "/clubInfomap" : `/${locale.value}/clubInfomap`,
  },
  // ...(import.meta.dev
  //   ? [
  //       {
  //         label: t("nav.clubInfo"),
  //         to: locale.value === "ko" ? "/clubInfo" : `/${locale.value}/clubInfo`,
  //       },
  //     ]
  //   : []),
]);

const title = useI18n().t("app.title");
const description = useI18n().t("app.description");

// useSeoMeta({
//   title,
//   description,
//   ogTitle: title,
//   ogDescription: description,
//   ogImage: "/social-card.png",
//   twitterImage: "/social-card.png",
//   twitterCard: "summary_large_image",
// });

const availableLocales = computed(() => {
  return locales.value.filter((i) => i.code !== locale.value);
});

useHead({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: computed(() =>
      import.meta.client ? localStorage.getItem("locale") || "ko" : "ko"
    ),
  },
});

// 앱 초기화 시 한 번만 locale 체크
onBeforeMount(async () => {});

const onBeforeEnter = async () => {
  await finalizePendingLocaleChange();
};

// 컴포넌트 마운트 시 클럽 데이터 가져오기
onBeforeMount(() => {
  clubStore.fetchClubs();
});

// 선택된 클럽 변경 핸들러
const handleClubSelect = (clubId) => {
  if (clubId) {
    clubStore.setSelectedClub(clubId);
    console.log("선택된 클럽:", clubId); // 디버깅용
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <UNotifications />
    <NuxtLoadingIndicator />
    <UHeader :links="links">
      <template #logo>
        <ClientOnly>
          <NuxtLink to="/" class="text-lg font-bold"> Zouk Korea </NuxtLink>
        </ClientOnly>
      </template>

      <template #right>
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- 클럽 선택 ComboBox 추가 -->
          <!-- <USelectMenu
            v-model="clubStore.selectedClubId"
            :options="clubOptions"
            :placeholder="t('clubs.select')"
            class="w-48"
            @update:model-value="handleClubSelect"
          /> -->

          <NuxtLink
            v-for="curLocale in availableLocales"
            :key="curLocale.code"
            :to="switchLocalePath(curLocale.code)"
            class="text-xs sm:text-base"
          >
            {{ curLocale.name }}
          </NuxtLink>

          <UColorModeButton />
        </div>
      </template>
    </UHeader>

    <UMain class="flex-grow">
      <NuxtPage
        :transition="{
          name: 'page',
          mode: 'out-in',
          onBeforeEnter,
        }"
      />
    </UMain>

    <UFooter>
      <!-- <template #left>
        {{ $t("app.copyright", { year: new Date().getFullYear() }) }}
      </template> -->
    </UFooter>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s;
}
.page-enter,
.page-leave-active {
  opacity: 0;
}
</style>
