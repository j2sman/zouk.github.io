import { Location } from "~/database/clubinfo";
export const MAP_FILE_PATH_COMPRESSED = "/korea.lz4.txt";
export const MAP_FILE_PATH_DECOMPRESSED = "/korea.json";

// 문의 URL
export const QNA_URL = "https://open.kakao.com/o/sDKuRzAg";

// 비디오 투명도 관리를 위한 ref 추가(0 ~ 100. 100 == 불투명)
export const VIDEO_OPACITY = 100;

// 배경 비디오 URL
export const INDEX_BACKGROUND_VIDEO =
  "https://www.youtube.com/watch?v=JawTJWFum64";

// 동호회 소개 비디오 URL
export const CLUBINFO_BACKGROUND_VIDEO =
  "https://www.youtube.com/watch?v=7jU-h-ctxVI";

// 캘린더 ID 목록
export const MAIN_CALENDAR_ID = "zoukkorea@gmail.com";

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
  naverband: {
    icon: "i-simple-icons-nativescript",
    color: "blue",
  },
  navercafe: {
    icon: "i-simple-icons-naver",
    color: "green",
  },
  daumcafe: {
    icon: "i-simple-icons-kakao",
    color: "orange",
  },
};

export const MAP_ICONS = {
  naver: {
    icon: "i-simple-icons-naver",
    color: "green",
  },
  google: {
    icon: "i-simple-icons-google",
    color: "blue",
  },
  kakao: {
    icon: "i-simple-icons-kakao",
    color: "yellow",
  },
};

export const locationMapping = {
  [Location.seoul]: {
    ko: "서울특별시",
    en: "Seoul",
  },
  [Location.gyeonggi]: {
    ko: "경기도",
    en: "Gyeonggi",
  },
  [Location.incheon]: {
    ko: "인천광역시",
    en: "Incheon",
  },
  [Location.gangwon]: {
    ko: "강원도",
    en: "Gangwon",
  },
  [Location.chungbuk]: {
    ko: "충청북도",
    en: "North Chungcheong",
  },
  [Location.chungnam]: {
    ko: "충청남도",
    en: "South Chungcheong",
  },
  [Location.busan]: {
    ko: "부산광역시",
    en: "Busan",
  },
  [Location.daegu]: {
    ko: "대구광역시",
    en: "Gwangju",
  },
  [Location.daejeon]: {
    ko: "대전광역시",
    en: "Daejeon",
  },
  [Location.ulsan]: {
    ko: "울산광역시",
    en: "Ulsan",
  },
  [Location.sejong]: {
    ko: "세종특별자치시",
    en: "Sejong",
  },
  [Location.jeju]: {
    ko: "제주특별자치도",
    en: "Jeju",
  },
};

export const labelOffsets = {
  [Location.seoul]: [0, 0],
  [Location.gyeonggi]: [0, -20],
  [Location.incheon]: [-20, 0],
  [Location.gangwon]: [20, -20],
  [Location.chungbuk]: [0, 0],
  [Location.chungnam]: [-30, 0],
  [Location.busan]: [20, 10],
  [Location.daegu]: [-10, -10],
  [Location.gwangju]: [-15, 15],
  [Location.daejeon]: [15, -5],
  [Location.ulsan]: [20, 0],
  [Location.sejong]: [-5, 10],
  [Location.jeonbuk]: [0, 0],
  [Location.jeonnam]: [-20, 20],
  [Location.gyeongbuk]: [30, 0],
  [Location.gyeongnam]: [0, 15],
  [Location.jeju]: [0, 10],
};
