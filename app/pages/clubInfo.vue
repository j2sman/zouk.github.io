<script setup>
const { t } = useI18n();
const clubStore = useClubStore();
const { $device } = useNuxtApp();

// 컴포넌트 마운트 시 클럽 데이터 가져오기
onMounted(() => {
  clubStore.fetchClubs();
  if (process.env.NODE_ENV === "development") {
    console.log(`totalClubs:\n${JSON.stringify(clubStore.totalClubs)}`); // URL 데이터 로깅
  }
});

// 소셜 미디어 아이콘과 색상 설정
const socialIcons = {
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
};

// 소셜 미디어 링크 필터링 함수
const getActiveLinks = (urls) => {
  // urls가 존재하는지 확인하고, 값이 있는 링크만 필터링
  if (!urls) return [];
  return Object.entries(urls).filter(([type, value]) => {
    // kakaotalk 특별 처리
    if (type === "kakaotalk") {
      // URL이거나 (모바일이면서 ID값이 있는 경우) 표시
      return (
        value &&
        (value.toString().startsWith("http") ||
          ($device.isMobile.value.value && value.toString().length > 0))
      );
    }

    return value && value.length > 0;
  });
};

// URL에서 YouTube 비디오 ID 추출
const getYoutubeVideoId = (url) => {
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
const getInstagramPostId = (url) => {
  if (!url) return null;

  const regExp = /instagram.com\/p\/([^/?#&]+)/;
  const match = url.match(regExp);

  return match ? match[1] : null;
};

// 배경 타입 확인 함수
const getBackgroundType = (background) => {
  if (!background) return "none";
  if (background.endsWith(".mp4")) return "video";
  if (background.includes("youtube.com") || background.includes("youtu.be"))
    return "youtube";
  if (background.includes("instagram.com")) return "instagram";
  return "image";
};

// 배경 스타일 계산 함수
const getBackgroundConfig = (background) => {
  if (!background) return {};

  const baseStyle = {
    base: "relative overflow-hidden",
    background: "before:absolute before:inset-0 before:bg-black/10 before:z-0",
  };

  const bgType = getBackgroundType(background);

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
const isVideoBackground = (background) => {
  const bgType = getBackgroundType(background);
  return ["video", "youtube", "instagram"].includes(bgType);
};

// 임베드 URL 생성 함수
const getEmbedUrl = (background) => {
  const bgType = getBackgroundType(background);

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
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-8">{{ $t("clubs.title") }}</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ULandingHero
        v-for="club in clubStore.totalClubs"
        :key="club.id"
        size="sm"
        class="h-full"
        :ui="{ background: getBackgroundConfig(club.background) }"
      >
        <!-- 로컬 비디오 -->
        <video
          v-if="getBackgroundType(club.background) === 'video'"
          class="absolute inset-0 w-full h-full object-cover -z-10 opacity-40"
          autoplay
          muted
          loop
          playsinline
        >
          <source :src="club.background" type="video/mp4" />
        </video>

        <!-- YouTube/Instagram 임베드 -->
        <iframe
          v-if="
            ['youtube', 'instagram'].includes(
              getBackgroundType(club.background)
            )
          "
          class="absolute inset-0 w-full h-full -z-10 opacity-40"
          :src="getEmbedUrl(club.background)"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>

        <template #title>
          {{ club.name }}
        </template>
        <template #description>
          {{ club.description }}
        </template>
        <template #links>
          <UButton
            v-for="[type, url] in getActiveLinks(club.urls)"
            :key="type"
            :icon="socialIcons[type].icon"
            :color="socialIcons[type].color"
            :to="url"
            target="_blank"
            size="lg"
          />
        </template>
      </ULandingHero>
    </div>
  </div>
</template>

<style scoped>
.u-landing-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
