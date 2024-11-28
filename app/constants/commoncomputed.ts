import {
  INDEX_BACKGROUND_VIDEO,
  CLUBINFO_BACKGROUND_VIDEO,
  LOCATION_NAME_MAPPING,
} from "./commonvars";

// YouTube 비디오 여부 확인
export const IS_INDEX_YOUTUBE_BACKGROUND_VIDEO = computed(() => {
  return (
    INDEX_BACKGROUND_VIDEO.includes("youtube.com") ||
    INDEX_BACKGROUND_VIDEO.includes("youtu.be")
  );
});

// YouTube 비디오 여부 확인
export const IS_CLUBINFO_YOUTUBE_BACKGROUND_VIDEO = computed(() => {
  return (
    CLUBINFO_BACKGROUND_VIDEO.includes("youtube.com") ||
    CLUBINFO_BACKGROUND_VIDEO.includes("youtu.be")
  );
});

export const getLocationKey = (propertyName: string) => {
  return Object.entries(LOCATION_NAME_MAPPING).find(
    ([_, value]) => value.ko === propertyName || value.en === propertyName
  )?.[0];
};
