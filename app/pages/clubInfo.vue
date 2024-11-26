<script setup>
import {
  getMediaType,
  getBackgroundConfig,
  getEmbedUrl,
  getUrlByType,
  socialIcons,
} from "~/utils/media";
import { UrlType, Location } from "~/database/clubinfo";

const { t, locale } = useI18n();
const clubStore = useClubStore();
const { $device } = useNuxtApp();

// 비디오 재생 관리를 위한 ref 추가
const videoRefs = ref({});
const iframeRefs = ref({});

// 비디오 투명도 관리를 위한 ref 추가(0 ~ 100. 100 == 불투명)
const videoOpacity = ref(40);

// 컴포넌트 마운트 시 클럽 데이터 가져오기
onBeforeMount(() => {
  clubStore.fetchClubs();
});

// 지역별로 클럽 그룹화
const clubsByLocation = computed(() => {
  const grouped = {};
  Object.values(Location).forEach((location) => {
    grouped[location] = clubStore.totalClubs.filter((club) => {
      const normalizedClubLocation = String(club.location).trim().toLowerCase();
      const normalizedLocation = String(location).trim().toLowerCase();

      // if (process.env.NODE_ENV === "development") {
      //   console.log(
      //     `Comparing - Club: "${normalizedClubLocation}", Location: "${normalizedLocation}"`
      //   );
      // }

      return normalizedClubLocation === normalizedLocation;
    });
  });

  // if (process.env.NODE_ENV === "development") {
  //   console.log("Grouped clubs:", grouped);
  // }

  return grouped;
});

// 소셜 미디어 링크 필터링 함수
const getSocialMediaLinks = (urls) => {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.filter((url) => {
    const normalizedUrlType = String(url.type).trim().toLowerCase();
    if (
      normalizedUrlType === UrlType.background.toLowerCase() ||
      normalizedUrlType === UrlType.homepage.toLowerCase()
    )
      return false;
    if (normalizedUrlType === UrlType.kakaotalk.toLowerCase()) {
      return (
        url.value &&
        (url.value.toString().startsWith("http") ||
          ($device.isMobile.value.value && url.value.toString().length > 0))
      );
    }
    return url.value && url.value.length > 0;
  });
};

// 번역된 텍스트를 가져오는 함수
const getTranslatedText = (club, field) => {
  const currentTranslation = club.translations[locale.value]?.[field];
  if (currentTranslation) return currentTranslation;

  const defaultTranslation = club.translations[club.default_language]?.[field];
  if (defaultTranslation) return defaultTranslation;

  const firstAvailableTranslation = Object.values(club.translations)[0]?.[
    field
  ];
  if (firstAvailableTranslation) return firstAvailableTranslation;

  return "";
};

// Intersection Observer 설정
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const elementId = entry.target.dataset.clubId;
        const video = videoRefs.value[elementId];
        const iframe = iframeRefs.value[elementId];

        if (video) {
          if (entry.isIntersecting) {
            video.play().catch((error) => {
              console.warn("비디오 자동 재생 실패:", error);
            });
          } else {
            video.pause();
          }
        }

        if (iframe) {
          if (entry.isIntersecting) {
            iframe.src = iframe.dataset.src;
          } else {
            iframe.src = "";
          }
        }
      });
    },
    { threshold: 0.1 }
  );

  // 모든 비디오와 iframe 요소 관찰 시작
  setTimeout(() => {
    [
      ...Object.values(videoRefs.value),
      ...Object.values(iframeRefs.value),
    ].forEach((element) => {
      if (element && element.parentElement) {
        observer.observe(element.parentElement);
      }
    });
  }, 100);

  // 컴포넌트 언마운트 시 observer 정리
  onUnmounted(() => {
    observer.disconnect();
  });
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-8">{{ $t("clubs.title") }}</h1>

    <ClientOnly>
      <div
        v-for="(clubs, location) in clubsByLocation"
        v-show="clubs.length > 0"
        :key="location"
        class="mb-12"
      >
        <h2 class="text-2xl font-semibold mb-6 p-4 rounded-lg">
          {{ location }}
        </h2>

        <UPageGrid>
          <ULandingHero
            v-for="club in clubs"
            :key="club.id"
            size="sm"
            class="h-full"
            :ui="{
              background: getBackgroundConfig(
                getUrlByType(club.urls, UrlType.background)
              ),
            }"
          >
            <!-- 로컬 비디오 -->
            <video
              v-if="
                getMediaType(getUrlByType(club.urls, UrlType.background)) ===
                'video'
              "
              :ref="(el) => (videoRefs[club.id] = el)"
              :data-club-id="club.id"
              class="absolute inset-0 w-full h-full object-fill -z-10"
              :class="`opacity-${videoOpacity}`"
              muted
              loop
              playsinline
            >
              <source
                :src="getUrlByType(club.urls, UrlType.background)"
                type="video/mp4"
              />
            </video>

            <!-- YouTube/Instagram 임베드 -->
            <iframe
              v-if="
                ['youtube', 'instagram'].includes(
                  getMediaType(getUrlByType(club.urls, UrlType.background))
                )
              "
              :ref="(el) => (iframeRefs[club.id] = el)"
              :data-club-id="club.id"
              :src="getEmbedUrl(getUrlByType(club.urls, UrlType.background))"
              class="absolute inset-0 w-full h-full -z-10 object-cover"
              :class="`opacity-${videoOpacity}`"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />

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
        </UPageGrid>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped></style>
