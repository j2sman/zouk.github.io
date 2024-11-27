// 문의 URL
export const QNA_URL = "https://open.kakao.com/o/sDKuRzAg";

// 비디오 투명도 관리를 위한 ref 추가(0 ~ 100. 100 == 불투명)
export const VIDEO_OPACITY = 40;

// 배경 비디오 URL
export const INDEX_BACKGROUND_VIDEO =
  "https://www.youtube.com/watch?v=JawTJWFum64";

// YouTube 비디오 여부 확인
export const IS_YOUTUBE_BACKGROUND_VIDEO = computed(() => {
  return (
    INDEX_BACKGROUND_VIDEO.includes("youtube.com") ||
    INDEX_BACKGROUND_VIDEO.includes("youtu.be")
  );
});

// 캘린더 ID 목록
export const CALENDAR_IDS = ["zoukkorea@gmail.com"];

export const SOCIAL_ICONS = {
  homepage: {
    icon: "i-heroicons-home",
    color: "gray",
  },
  youtube: {
    icon: "i-simple-icons-youtube",
    color: "red",
  },
  instagram: {
    icon: "i-simple-icons-instagram",
    color: "purple",
  },
  facebook: {
    icon: "i-simple-icons-facebook",
    color: "blue",
  },
  kakaotalk: {
    icon: "i-simple-icons-kakaotalk",
    color: "yellow",
  },
  background: {
    icon: "i-heroicons-photo",
    color: "gray",
  },
};
