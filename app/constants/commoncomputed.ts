import {
  SCHEDULE_BACKGROUND_VIDEO,
  CLUBINFO_BACKGROUND_VIDEO,
  LOCATION_NAME_MAPPING,
} from "./commonvars";

// YouTube 비디오 여부 확인
export const IS_SCHEDULE_YOUTUBE_BACKGROUND_VIDEO = computed(() => {
  return (
    SCHEDULE_BACKGROUND_VIDEO.includes("youtube.com") ||
    SCHEDULE_BACKGROUND_VIDEO.includes("youtu.be")
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
