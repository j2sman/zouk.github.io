import { INDEX_BACKGROUND_VIDEO } from "./commonvars";

// YouTube 비디오 여부 확인
export const IS_YOUTUBE_BACKGROUND_VIDEO = computed(() => {
  return (
    INDEX_BACKGROUND_VIDEO.includes("youtube.com") ||
    INDEX_BACKGROUND_VIDEO.includes("youtu.be")
  );
});
