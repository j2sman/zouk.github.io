<template>
  <div class="container mx-auto px-4 py-8">
    <div class="video-background" ref="videoContainer">
      <iframe
        v-if="isYoutubeVideo"
        :src="videoEmbedUrl"
        class="absolute inset-0 w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      <video
        v-else
        ref="videoElement"
        :autoplay="isVideoVisible"
        muted
        loop
        preload="none"
      >
        <source :src="videoEmbedUrl" type="video/mp4" />
      </video>
    </div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold">
        {{ $t("schedule.title") }}
      </h1>
    </div>

    <!-- 구글 캘린더 임베드 -->
    <ClientOnly>
      <div class="calendar-container bg-white/5 dark:bg-gray-900/20 rounded-xl p-4">
        <iframe
          :src="calendarUrl"
          style="border: 0"
          class="w-full h-[80vh] bg-transparent"
          frameborder="0"
          scrolling="no"
        ></iframe>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup>
import {
  SCHEDULE_BACKGROUND_VIDEO,
  MAIN_CALENDAR_ID,
} from "~/constants/commonvars";
import { IS_SCHEDULE_YOUTUBE_BACKGROUND_VIDEO } from "~/constants/commoncomputed";
import { getEmbedUrl, getCalendarUrl } from "~/utils/media";
import { useCalendarStore } from "~/stores/calandarStore";

const { t, locale } = useI18n();
const colorMode = useColorMode();

const backgroundVideo = ref(SCHEDULE_BACKGROUND_VIDEO);
const isYoutubeVideo = ref(IS_SCHEDULE_YOUTUBE_BACKGROUND_VIDEO);
const videoEmbedUrl = getEmbedUrl(backgroundVideo.value);

// 비디오 관련 refs 추가
const isVideoVisible = ref(false);
const videoContainer = ref(null);
const videoElement = ref(null);

// Intersection Observer 설정
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVideoVisible.value = true;
          if (videoElement.value) {
            videoElement.value.load();
          }
          observer.disconnect(); // 한 번 로드되면 관찰 중단
        }
      });
    },
    {
      threshold: 0.1, // 10% 이상 보일 때 로드
      rootMargin: "50px", // 미리 로드 시작
    }
  );

  if (videoContainer.value) {
    observer.observe(videoContainer.value);
  }

  // 컴포넌트 언마운트 시 observer 정리
  onUnmounted(() => {
    observer.disconnect();
  });
});

const calendarStore = useCalendarStore();
const combinedCalendarIds = ref([]);

// 컴포넌트 마운트 시 캘린더 목록 가져오기
onMounted(async () => {
  await calendarStore.fetchCalendarList();

  if (import.meta.dev) {
    console.log(`calendarList : ${JSON.stringify(calendarStore.calendarList)}`);
  }

  const enabledCalendarIds =
    calendarStore.calendarList
      ?.filter((calendar) => calendar.enabled)
      ?.map((calendar) => calendar.calendar_id) || [];

  combinedCalendarIds.value = enabledCalendarIds;
});

const calendarUrl = computed(() => {
  return getCalendarUrl(
    MAIN_CALENDAR_ID,
    combinedCalendarIds.value,
    colorMode,
    locale.value
  );
});

useHead({
  title: `${t("schedule.title")} - Zouk Korea`,
  meta: [
    {
      name: "description",
      content: t("schedule.description"),
    },
  ],
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.min-h-screen {
  min-height: calc(100vh - 64px); /* 헤더 높이만큼 빼기 */
}

.video-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.video-background::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7); /* 여기서 투명도 조절 (0.2 = 60% 투명) */
}

.video-background video,
.video-background iframe {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  transform: none;
}

.calendar-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
}

/* 구글 캘린더 iframe 투명도 조정을 위한 새로운 스타일 */
.calendar-container iframe {
  opacity: 0.8; /* 50% 불투명도로 변경 */
  transition: opacity 0.3s ease;
}

.calendar-container:hover iframe {
  opacity: 1; /* 호버시 100% 불투명 */
}
</style>
