<script setup>
import {
  getMediaType,
  getBackgroundConfig,
  getEmbedUrl,
  getUrlByType,
  socialIcons,
} from "~/utils/media";
import { UrlType } from "~/database/clubinfo";

const { t, locale } = useI18n();
const clubStore = useClubStore();
const { $device } = useNuxtApp();

// 컴포넌트 마운트 시 클럽 데이터 가져오기
onBeforeMount(() => {
  clubStore.fetchClubs();
});

// 소셜 미디어 링크 필터링 함수
const getSocialMediaLinks = (urls) => {
  // urls가 배열이 아니거나 비어있으면 빈 배열 반환
  if (!urls || !Array.isArray(urls)) return [];

  return urls.filter((url) => {
    // background와 homepage 타입 제외
    if (url.type === UrlType.background || url.type === UrlType.homepage)
      return false;

    // kakaotalk 특별 처리
    if (url.type === UrlType.kakaotalk) {
      return (
        url.value &&
        (url.value.toString().startsWith("http") ||
          ($device.isMobile.value.value && url.value.toString().length > 0))
      );
    }
    return url.value && url.value.length > 0;
  });
};

// 번역된 텍스트를 가져오는 함수 추가
const getTranslatedText = (club, field) => {
  // 현재 언어로 된 번역 시도
  const currentTranslation = club.translations[locale.value]?.[field];
  if (currentTranslation) return currentTranslation;

  // 기본 언어로 된 번역 시도
  const defaultTranslation = club.translations[club.default_language]?.[field];
  if (defaultTranslation) return defaultTranslation;

  // 사용 가능한 첫 번째 번역 반환
  const firstAvailableTranslation = Object.values(club.translations)[0]?.[
    field
  ];
  if (firstAvailableTranslation) return firstAvailableTranslation;

  // 모든 시도가 실패하면 빈 문자열 반환
  return "";
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-8">{{ $t("clubs.title") }}</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ULandingHero
        v-for="club in clubStore.totalClubs"
        :key="club.id"
        size="sm"
        class="h-full"
        :ui="{
          background: getBackgroundConfig(
            getUrlByType(club.urls, 'background')
          ),
        }"
      >
        <!-- 로컬 비디오 -->
        <video
          v-if="getMediaType(getUrlByType(club.urls, 'background')) === 'video'"
          class="absolute inset-0 w-full h-full object-cover -z-10 opacity-40"
          autoplay
          muted
          loop
          playsinline
        >
          <source
            :src="getUrlByType(club.urls, 'background')"
            type="video/mp4"
          />
        </video>

        <!-- YouTube/Instagram 임베드 -->
        <iframe
          v-if="
            ['youtube', 'instagram'].includes(
              getMediaType(getUrlByType(club.urls, 'background'))
            )
          "
          class="absolute inset-0 w-full h-full -z-10 opacity-40"
          :src="getEmbedUrl(getUrlByType(club.urls, 'background'))"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>

        <template #title>
          {{ getTranslatedText(club, "club_name") }}
        </template>
        <template #description>
          {{ getTranslatedText(club, "description") }}
        </template>
        <template #links>
          <UButton
            v-for="url in getSocialMediaLinks(club.urls)"
            :key="url.type"
            :icon="socialIcons[url.type].icon"
            :color="socialIcons[url.type].color"
            :to="url.value"
            target="_blank"
            size="lg"
          />
        </template>
      </ULandingHero>
    </div>
  </div>
</template>

<style scoped>
.u-landing-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
