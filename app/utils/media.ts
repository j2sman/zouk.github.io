// 소셜 미디어 아이콘과 색상 설정
/** @type {import('~/database/clubinfo').UrlType} 타입의 키를 가진 아이콘 설정 객체 */
export const socialIcons = {
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
export const getUrlByType = (urls: any[], type: string): string | null => {
  if (!urls || !Array.isArray(urls)) return null;
  const url = urls.find((url) => url.type === type);
  return url ? url.value : null;
};

// 배경 타입 확인 함수
export const getMediaType = (media: string | null): string => {
  if (!media) return "none";
  if (media.endsWith(".mp4")) return "video";
  if (media.includes("youtube.com") || media.includes("youtu.be"))
    return "youtube";
  if (media.includes("instagram.com")) return "instagram";
  return "image";
};

// 배경 스타일 계산 함수
export const getBackgroundConfig = (background: string | null) => {
  if (!background) return {};

  const baseStyle = {
    base: "relative overflow-hidden",
    background: "before:absolute before:inset-0 before:bg-black/10 before:z-0",
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
};

// 비디오 배경 여부 확인 함수
export const isVideoBackground = (background: string | null): boolean => {
  const bgType = getMediaType(background);
  return ["video", "youtube", "instagram"].includes(bgType);
};

// 임베드 URL 생성 함수
export const getEmbedUrl = (background: string | null): string | null => {
  const bgType = getMediaType(background);

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
};
