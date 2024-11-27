<script setup>
import { SOCIAL_ICONS } from "~/constants/commonvars";
import {
  getMediaType,
  getBackgroundConfig,
  getEmbedUrl,
  getUrlByType,
} from "~/utils/media";
import { UrlType, Location } from "~/database/clubinfo";
import { getSocialMediaLinks, getTranslatedText } from "~/utils/media";
import { VIDEO_OPACITY, QNA_URL } from "~/constants/commonvars";

const { t, locale } = useI18n();
const clubStore = useClubStore();
const { $device } = useNuxtApp();

// 비디오 재생 관리를 위한 ref 추가
const videoRefs = ref({});
const iframeRefs = ref({});
const socialIcons = ref(SOCIAL_ICONS);

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

      // if (import.meta.dev) {
      //   console.log(
      //     `Comparing - Club: "${normalizedClubLocation}", Location: "${normalizedLocation}"`
      //   );
      // }

      return normalizedClubLocation === normalizedLocation;
    });
  });

  // if (import.meta.dev) {
  //   console.log("Grouped clubs:", grouped);
  // }

  return grouped;
});

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

const clubMediaTypes = computed(() => {
  const types = {};
  clubStore.totalClubs.forEach((club) => {
    try {
      const backgroundUrl = getUrlByType(club.urls, UrlType.background);
      types[club.id] = getMediaType(backgroundUrl);
    } catch (error) {
      console.error("클럽 미디어 타입 확인 중 오류:", error, {
        clubId: club.id,
      });
      types[club.id] = "none";
    }
  });
  return types;
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold">{{ $t("clubs.title") }}</h1>
      <UButton
        icon="i-ri-kakao-talk-fill"
        color="yellow"
        :to="QNA_URL"
        target="_blank"
        size="lg"
      >
        {{ $t("clubs.qna") }}
      </UButton>
    </div>

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
              v-if="clubMediaTypes[club.id] === 'video'"
              :ref="(el) => (videoRefs[club.id] = el)"
              :data-club-id="club.id"
              class="video-background"
              :style="`opacity: ${VIDEO_OPACITY}%`"
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
              v-if="['youtube', 'instagram'].includes(clubMediaTypes[club.id])"
              :ref="(el) => (iframeRefs[club.id] = el)"
              :data-club-id="club.id"
              :src="getEmbedUrl(getUrlByType(club.urls, UrlType.background))"
              class="video-background"
              :style="`opacity: ${VIDEO_OPACITY}%`"
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
                v-for="url in getSocialMediaLinks(
                  club.urls,
                  $device.isMobile.value.value
                )"
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

<style scoped>
.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.video-background::after {
  position: absolute;
  content: "";
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
}

.video-background video,
.video-background iframe {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  top: 0;
  left: 0;
  transform: none;
}
</style>
