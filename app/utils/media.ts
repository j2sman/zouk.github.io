// 소셜 미디어 아이콘과 색상 설정

import { UrlType } from "~/database/clubinfo";

// iframe URL computed 속성
export const getCalendarUrl = (
  mainCalendarId: string,
  calendarIds: string[],
  colorMode: any,
  localeValue: string
) => {
  const calendarsParam = [mainCalendarId, ...calendarIds]
    .map((id) => `src=${encodeURIComponent(id)}`)
    .join("&");

  // clientOnly 컴포넌트로 감싸거나, 클라이언트 사이드에서만 테마 값을 사용
  const themeValue = import.meta.client
    ? colorMode.value === "dark"
      ? "1"
      : "0"
    : "0";

  let strUrl = `https://calendar.google.com/calendar/embed?${calendarsParam}&ctz=Asia%2FSeoul&mode=MONTH&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=1&showTz=0&hl=${localeValue}&wkst=1&bgcolor=%23ffffff&themeId=${themeValue}`;
  if (import.meta.dev) {
    console.log(`calendarUrl : ${strUrl}`);
  }

  return strUrl;
};

// URL에서 YouTube 비디오 ID 추출
export const getYoutubeVideoId = (url: string | null): string | null => {
  if (!url) return null;

  // YouTube Shorts URL 처리
  if (url.includes("youtube.com/shorts/")) {
    const shortsMatch = url.match(/youtube\.com\/shorts\/([^/?#&]+)/);
    return shortsMatch ? shortsMatch[1] : null;
  }

  // 일반적인 YouTube URL 처리
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
};

// URL에서 Instagram 포스트 ID 추출
export const getInstagramPostId = (url: string | null): string | null => {
  if (!url) return null;

  const regExp = /instagram.com\/p\/([^/?#&]+)/;
  const match = url.match(regExp);

  return match ? match[1] : null;
};

// 배경 URL 가져오기 함수 추가
export const getUrlByType = (urls: any[], type: UrlType): string | null => {
  if (!urls || !Array.isArray(urls)) return null;

  try {
    const url = urls.find((url) => {
      if (!url || !url.type) return false;

      const normalizedType = String(url.type).trim().toLowerCase();
      const normalizedUrlType = String(type).trim().toLowerCase();

      return normalizedType === normalizedUrlType;
    });

    return url?.value || null;
  } catch (error) {
    console.error("Error in getUrlByType:", error);
    return null;
  }
};

// 배경 타입 확인 함수
export const getMediaType = (media: string | null | undefined): string => {
  // 더 엄격한 유효성 검사
  if (!media || media === "undefined" || media === "null") return "none";
  if (typeof media !== "string") return "none";
  if (media.trim() === "") return "none";

  try {
    const mediaStr = media.toLowerCase();
    if (mediaStr.endsWith(".mp4")) return "video";
    if (mediaStr.includes("youtube.com") || mediaStr.includes("youtu.be"))
      return "youtube";
    if (mediaStr.includes("instagram.com")) return "instagram";
    return "image";
  } catch (error) {
    console.error("Error in getMediaType:", error, { mediaValue: media });
    return "none";
  }
};

// 배경 스타일 계산 함수
export const getBackgroundConfig = (background: string | null) => {
  try {
    if (!background) return {};

    const baseStyle = {
      base: "relative overflow-hidden",
      background:
        "before:absolute before:inset-0 before:bg-black/10 before:z-0",
    };

    const bgType = getMediaType(background);

    if (["video", "youtube", "instagram"].includes(bgType)) {
      return baseStyle;
    }

    return {
      ...baseStyle,
      background: `${baseStyle.background} bg-cover bg-center`,
      backgroundImage: `url(${background})`,
    };
  } catch (error) {
    console.error("Error in getEmbedUrl:", error, {
      backgroundValue: background,
    });
    return {};
  }
};

// 임베드 URL 생성 함수
export const getEmbedUrl = (background: string | null): string | null => {
  try {
    const bgType = getMediaType(background);
    //console.log(`bgType: ${bgType}, background: ${JSON.stringify(background)}`);

    switch (bgType) {
      case "youtube": {
        const videoId = getYoutubeVideoId(background);
        return videoId
          ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`
          : null;
      }
      case "instagram": {
        const postId = getInstagramPostId(background);
        return postId ? `https://www.instagram.com/p/${postId}/embed` : null;
      }
      case "video":
        return background;
      default:
        return null;
    }
  } catch (error) {
    console.error("Error in getEmbedUrl:", error, {
      backgroundValue: background,
    });
    return null;
  }
};

// 소셜 미디어 링크 필터링 함수
export const getSocialMediaLinks = (urls: any[], isMobile: boolean) => {
  if (!urls || !Array.isArray(urls)) return [];

  // UrlType enum의 값들을 배열로 변환하여 순서 맵 생성
  const urlTypeOrder = Object.values(UrlType).reduce((acc, type, index) => {
    acc[type.toLowerCase()] = index;
    return acc;
  }, {} as Record<string, number>);

  return urls
    .filter((url) => {
      const normalizedUrlType = String(url.type).trim().toLowerCase();
      if (
        normalizedUrlType === UrlType.background.toLowerCase() ||
        normalizedUrlType === UrlType.homepage.toLowerCase()
      )
        return false;
      if (normalizedUrlType === UrlType.kakaotalk.toLowerCase()) {
        return (
          url.value &&
          (url.value.toString().startsWith("http") ||
            (isMobile && url.value.toString().length > 0))
        );
      }
      return url.value && url.value.length > 0;
    })
    .sort((a, b) => {
      const typeA = String(a.type).trim().toLowerCase();
      const typeB = String(b.type).trim().toLowerCase();
      return (urlTypeOrder[typeA] || 999) - (urlTypeOrder[typeB] || 999);
    });
};

// 번역된 텍스트를 가져오는 함수
export const getTranslatedText = (
  club: any,
  field: string,
  localeValue: string
) => {
  const currentTranslation = club.translations[localeValue]?.[field];
  if (currentTranslation) return currentTranslation;

  const defaultTranslation = club.translations[club.default_language]?.[field];
  if (defaultTranslation) return defaultTranslation;

  const firstAvailableTranslation = Object.values(club.translations)[0]?.[
    field
  ];
  if (firstAvailableTranslation) return firstAvailableTranslation;

  return "";
};
