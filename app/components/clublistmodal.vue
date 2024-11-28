<script setup>
import {
  getMediaType,
  getBackgroundConfig,
  getEmbedUrl,
  getUrlByType,
} from "~/utils/media";
import { UrlType } from "~/database/clubinfo";
import {
  VIDEO_OPACITY,
  SOCIAL_ICONS,
  locationMapping,
} from "~/constants/commonvars";
import { getLocationKey } from "~/constants/commoncomputed";
import { getSocialMediaLinks, getTranslatedText } from "~/utils/media";

const props = defineProps({
  showClubList: {
    type: Boolean,
    required: true,
  },
  selectedRegion: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:showClubList"]);

// 비디오 재생 관리를 위한 ref 추가
const videoRefs = ref({});
const iframeRefs = ref({});
const { locale } = useI18n();
const { $device } = useNuxtApp();
const clubStore = useClubStore();

// Add socialIcons ref
const socialIcons = ref(SOCIAL_ICONS);

// getTranslatedText 호출 시 안전하게 처리
const safeGetTranslatedText = (club, field) => {
  return getTranslatedText(club, field, locale.value);
};

// Add clubMediaTypes computed property
const clubBackgroundMediaTypes = computed(() => {
  const types = {};
  filteredClubs.value.forEach((club) => {
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

// 지역 이름을 현재 locale에 맞게 변환하는 computed 속성 추가
const localizedSelectedRegion = computed(() => {
  if (!props.selectedRegion) return "";
  const locationKey = getLocationKey(props.selectedRegion);
  return locationMapping[locationKey]?.[locale.value] || props.selectedRegion;
});

// 필터링된 클럽 목록
const filteredClubs = computed(() => {
  if (!props.selectedRegion) return clubStore.totalClubs;
  const locationKey = getLocationKey(props.selectedRegion);
  return clubStore.totalClubs.filter((club) => {
    const normalizedClubLocation = String(club.location).trim().toLowerCase();
    const normalizedLocation = String(locationKey).trim().toLowerCase();

    // if (import.meta.dev) {
    //   console.log(
    //     `Comparing - Club: "${normalizedClubLocation}", Location: "${normalizedLocation}"`
    //   );
    // }

    return normalizedClubLocation === normalizedLocation;
  });
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
</script>

<template>
  <ClientOnly>
    <UModal
      :model-value="showClubList"
      @update:model-value="emit('update:showClubList', $event)"
    >
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-semibold">
              {{ localizedSelectedRegion }}
            </h2>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              @click="emit('update:showClubList', false)"
            />
          </div>
        </template>

        <div class="club-list-container">
          <ULandingHero
            v-for="club in filteredClubs"
            :key="club.id"
            size="sm"
            class="club-item mb-4"
            :ui="{
              background: getBackgroundConfig(
                getUrlByType(club.urls, UrlType.background)
              ),
            }"
          >
            <!-- video background -->
            <video
              v-if="clubBackgroundMediaTypes[club.id] === 'video'"
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

            <!-- iframe background -->
            <iframe
              v-if="
                ['youtube', 'instagram'].includes(
                  clubBackgroundMediaTypes[club.id]
                )
              "
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
              {{ safeGetTranslatedText(club, "club_name") }}
            </template>
            <template #description>
              {{ safeGetTranslatedText(club, "description") }}
            </template>
            <template #links>
              <UButton
                v-for="url in getSocialMediaLinks(club.urls, $device.isMobile)"
                :key="url.type"
                :icon="socialIcons[url.type].icon"
                :color="socialIcons[url.type].color"
                :to="url.value"
                target="_blank"
                size="lg"
              >
                {{ url.additional_info }}
              </UButton>
            </template>
          </ULandingHero>
        </div>
      </UCard>
    </UModal>
  </ClientOnly>
</template>

<style scoped>
.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.video-background::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  z-index: 0;
  pointer-events: none;
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
  z-index: 0;
}

:deep(.modal-container) {
  max-width: 90vw;
  width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
}

:deep(.modal-card) {
  max-height: 100%;
}

.club-list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.club-item {
  width: 100%;
}

/* 컨텐츠의 z-index 추가 */
:deep(.landing-hero-content) {
  position: relative;
  z-index: 3;
  opacity: 1;
}

/* UButton이 클릭 가능하도록 z-index 추가 */
:deep(.u-button) {
  position: relative;
  z-index: 4;
  pointer-events: auto;
  opacity: 1;
  background-color: rgba(255, 255, 255, 1);
  backdrop-filter: blur(4px);
}
</style>
