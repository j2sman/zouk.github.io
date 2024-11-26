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
import { getYoutubeVideoId } from "~/utils/media";
const { t, locale } = useI18n();
const colorMode = useColorMode();

// 캘린더 ID 목록
const calendarIds = ["zoukkorea@gmail.com", "carlesargen@gmail.com"];

// iframe URL computed 속성
const calendarUrl = computed(() => {
  const calendarsParam = calendarIds
    .map((id) => `src=${encodeURIComponent(id)}`)
    .join("&");

  // clientOnly 컴포넌트로 감싸거나, 클라이언트 사이드에서만 테마 값을 사용
  const themeValue = import.meta.client
    ? colorMode.value === "dark"
      ? "1"
      : "0"
    : "0";

  return `https://calendar.google.com/calendar/embed?${calendarsParam}&ctz=Asia%2FSeoul&mode=MONTH&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=1&showTz=0&hl=${locale.value}&wkst=1&bgcolor=%23ffffff&themeId=${themeValue}`;
});

// 배경 비디오 URL
const backgroundVideo = "https://www.youtube.com/watch?v=JawTJWFum64";

// YouTube 비디오 여부 확인
const isYoutubeVideo = computed(() => {
  return (
    backgroundVideo.includes("youtube.com") ||
    backgroundVideo.includes("youtu.be")
  );
});

// YouTube 임베드 URL 생성
const youtubeEmbedUrl = computed(() => {
  const videoId = getYoutubeVideoId(backgroundVideo);
  return videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`
    : null;
});

useHead({
  title: `${t("schedule.title")} - LatinCielo`,
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
  background: rgba(0, 0, 0, 0.6); /* 여기서 투명도 조절 (0.2 = 60% 투명) */
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
