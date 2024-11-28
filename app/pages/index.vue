<template>
  <div class="container mx-auto px-4 py-8">
    <div class="video-background">
      <iframe
        v-if="isYoutubeVideo"
        :src="youtubeEmbedUrl"
        class="absolute inset-0 w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      <video v-else autoplay muted loop preload="none">
        <source :src="backgroundVideo" type="video/mp4" />
      </video>
    </div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold">
        {{ $t("schedule.title") }}
      </h1>
    </div>

    <!-- 구글 캘린더 임베드 -->
    <ClientOnly>
      <div
        class="calendar-container bg-white/5 dark:bg-gray-900/20 rounded-xl p-4"
      >
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
import { INDEX_BACKGROUND_VIDEO, CALENDAR_IDS } from "~/constants/commonvars";
import { IS_INDEX_YOUTUBE_BACKGROUND_VIDEO } from "~/constants/commoncomputed";
import { getEmbedUrl, getCalendarUrl } from "~/utils/media";
const { t, locale } = useI18n();
const colorMode = useColorMode();

const backgroundVideo = ref(INDEX_BACKGROUND_VIDEO);
const isYoutubeVideo = ref(IS_INDEX_YOUTUBE_BACKGROUND_VIDEO);
const youtubeEmbedUrl = getEmbedUrl(backgroundVideo.value);

const calendarUrl = getCalendarUrl(CALENDAR_IDS, colorMode, locale.value);

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
