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
  LOCATION_NAME_MAPPING,
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
  return (
    LOCATION_NAME_MAPPING[locationKey]?.[locale.value] || props.selectedRegion
  );
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
            // 비디오가 뷰포트에 들어왔을 때
            video.currentTime = 0; // 처음부터 재생
            video.play().catch((error) => {
              console.warn("비디오 자동 재생 실패:", error);
              video.muted = true;
              video.play().catch((retryError) => {
                console.error("비디오 재생 재시도 실패:", retryError);
              });
            });
          } else {
            // 비디오가 뷰포트를 벗어났을 때
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
    {
      threshold: 0.3, // 임계값 증가
      rootMargin: "100px", // 관찰 영역 확대
    }
  );

  // observer 설정 시점 조정
  nextTick(() => {
    const elements = document.querySelectorAll("[data-club-id]");
    elements.forEach((element) => {
      observer.observe(element);
    });
  });

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

        <UPageGrid
          :ui="{
            wrapper:
              'grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 2xl:grid-cols-1 gap-4',
          }"
        >
          <UPageCard
            v-for="club in filteredClubs"
            :key="club.id"
            :title="safeGetTranslatedText(club, 'club_name')"
            :description="safeGetTranslatedText(club, 'description')"
            class="club-item"
          >
            <template #icon>
              <div class="club-media-container">
                <!-- video background -->
                <video
                  v-if="['video'].includes(clubBackgroundMediaTypes[club.id])"
                  :ref="(el) => (videoRefs[club.id] = el)"
                  :data-club-id="club.id"
                  class="club-media"
                  :style="`opacity: ${VIDEO_OPACITY}%`"
                  muted
                  loop
                  playsinline
                  autoplay
                  preload="auto"
                  controlsList="nodownload nofullscreen noremoteplayback"
                  disablePictureInPicture
                  disableRemotePlayback
                  :controls="false"
                >
                  <source
                    :src="
                      getEmbedUrl(getUrlByType(club.urls, UrlType.background))
                    "
                    type="video/mp4"
                  />
                </video>
                <!-- iframe background -->
                <iframe
                  v-else-if="
                    ['youtube', 'instagram', 'googledrive'].includes(
                      clubBackgroundMediaTypes[club.id]
                    )
                  "
                  :ref="(el) => (iframeRefs[club.id] = el)"
                  :data-club-id="club.id"
                  :src="
                    getEmbedUrl(getUrlByType(club.urls, UrlType.background))
                  "
                  class="club-media"
                  :style="`opacity: ${VIDEO_OPACITY}%`"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                />
              </div>
            </template>

            <template #footer>
              <div class="mt-4 text-center space-y-4">
                <div class="flex flex-wrap justify-center gap-2">
                  <UButton
                    v-for="url in getSocialMediaLinks(
                      club.urls,
                      $device.isMobile
                    )"
                    :key="url.type"
                    :icon="socialIcons[url.type].icon"
                    :color="socialIcons[url.type].color"
                    :to="url.value"
                    target="_blank"
                    size="sm"
                  >
                    {{ url.additional_info }}
                  </UButton>
                </div>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
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
  z-index: 0;
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
  background: rgba(255, 255, 255, 1);
  z-index: -1;
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
  max-width: 95vw;
  width: 1600px;
  max-height: 95vh;
  overflow-y: auto;
}

:deep(.modal-card) {
  max-height: 100%;
  padding: 2rem;
}

.club-media-container {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
  border-radius: 0.5rem;
}

.club-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
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
