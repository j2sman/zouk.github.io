<script setup>
import { Location, UrlType } from "~/database/clubinfo";
import * as d3 from "d3";
import {
  CLUBINFO_BACKGROUND_VIDEO,
  VIDEO_OPACITY,
  QNA_URL,
  LOCATION_NAME_MAPPING,
  SOCIAL_ICONS,
  LOCATION_LABEL_OFFSETS,
} from "~/constants/commonvars";
import {
  getLocationKey,
  IS_CLUBINFO_YOUTUBE_BACKGROUND_VIDEO,
} from "~/constants/commoncomputed";
import { loadKoreaMap } from "~/utils/map";
import {
  getMediaType,
  getBackgroundConfig,
  getEmbedUrl,
  getUrlByType,
} from "~/utils/media";
import { getSocialMediaLinks, getTranslatedText } from "~/utils/media";
import clublistmodal from "~/components/clublistmodal.vue";

const { t, locale } = useI18n();
const clubStore = useClubStore();
const { $device } = useNuxtApp();

const backgroundVideo = ref(CLUBINFO_BACKGROUND_VIDEO);
const isYoutubeVideo = ref(IS_CLUBINFO_YOUTUBE_BACKGROUND_VIDEO);
const videoEmbedUrl = getEmbedUrl(backgroundVideo.value);

// locale이 준비되었는지 확인하는 computed 속성 추가
const isLocaleReady = computed(() => !!locale.value);

// 지도 관련 상태 추가
const selectedRegion = ref(null);
const mapContainer = ref(null);

// 클럽 목록 표시 상태 추가
const showClubList = ref(false);

// 비디오 가시성 상태 추가
const isVideoVisible = ref(false);
const videoContainer = ref(null);
const videoElement = ref(null);

// Intersection Observer 설정
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVideoVisible.value = true;
          if (videoElement.value) {
            videoElement.value.load();
          }
          observer.disconnect(); // 한 번 로드되면 관찰 중단
        }
      });
    },
    {
      threshold: 0.1, // 10% 이상 보일 때 로드
      rootMargin: "50px", // 미리 로드 시작
    }
  );

  if (videoContainer.value) {
    observer.observe(videoContainer.value);
  }

  // 컴포넌트 언마운트 시 observer 정리
  onUnmounted(() => {
    observer.disconnect();
  });
});

// 지도 초기화 함수
const initMap = async () => {
  // mapContainer가 존재하는지 확인
  if (!mapContainer.value) return;

  const containerWidth = mapContainer.value.clientWidth;
  const containerHeight = $device.isMobile
    ? window.innerHeight * 0.9
    : window.innerHeight * 0.7;

  // 지도 스케일 조정
  const mapScale = $device.isMobile ? containerWidth * 7.5 : containerWidth * 6;

  const svg = d3
    .select(mapContainer.value)
    .append("svg")
    .attr("width", "100%")
    .attr("height", containerHeight)
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .style("background", "transparent");

  try {
    const koreaMap = await loadKoreaMap();

    const projection = d3
      .geoMercator()
      .center([127.5, 35.5]) // 중심점 조정
      .scale(mapScale) // 스케일 조정
      .translate([containerWidth / 2, containerHeight / 2]);

    const path = d3.geoPath().projection(projection);

    // 지도 그리기
    svg
      .selectAll("path")
      .data(koreaMap.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", (d) => {
        const locationKey = getLocationKey(d.properties.name);
        const hasClubs = clubStore.hasClubsInLocation(locationKey);
        return `region ${
          selectedRegion.value === d.properties.name ? "selected" : ""
        } ${hasClubs ? "active" : "inactive"}`;
      })
      .attr("fill", (d) => {
        const locationKey = getLocationKey(d.properties.name);
        return clubStore.hasClubsInLocation(locationKey)
          ? "#e4e4e4"
          : "#f5f5f5";
      })
      .attr("stroke", "#aaa")
      .attr("stroke-width", "1.5")
      .on("click", (event, d) => {
        const locationKey = getLocationKey(d.properties.name);
        const hasClubs = clubStore.hasClubsInLocation(locationKey);
        if (hasClubs) {
          handleRegionClick(d.properties.name);
        }
      });

    // 지역명 레이블 추가
    svg
      .selectAll("text")
      // // 전체 데이터 표시
      // .data(koreaMap.features)
      // 클럽이 있는 지역만 표시
      .data(
        koreaMap.features.filter((d) => {
          const locationKey = getLocationKey(d.properties.name);
          return clubStore.hasClubsInLocation(locationKey);
        })
      )
      .enter()
      .append("text")
      .attr("transform", (d) => {
        const locationKey = getLocationKey(d.properties.name);
        const regionData = LOCATION_LABEL_OFFSETS[locationKey];
        const centroid = path.centroid(d);
        const offset = regionData ?? [0, 0];
        return `translate(${centroid[0] + offset[0]}, ${
          centroid[1] + offset[1]
        })`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text((d) => {
        const locationKey = getLocationKey(d.properties.name);
        return (
          LOCATION_NAME_MAPPING[locationKey]?.[locale.value] ||
          d.properties.name
        );
      })
      .attr("font-size", "14px")
      .attr("fill", "#555555")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", "2px")
      .attr("paint-order", "stroke")
      .style("font-weight", "700")
      .style("cursor", "pointer")
      .attr("pointer-events", "all")
      .on("click", (event, d) => {
        handleRegionClick(d.properties.name);
      });
  } catch (error) {
    console.error("지도 데이터 로드 실패:", error);
  }
};

// 화면 크기 변경 시 지도 다시 그리기
onMounted(async () => {
  await clubStore.fetchClubs();

  // nextTick을 사용하여 DOM이 완전히 렌더링된 후 초기화
  nextTick(() => {
    initMap();
  });

  const handleResize = () => {
    d3.select(mapContainer.value).select("svg").remove();
    initMap();
  };

  window.addEventListener("resize", handleResize);
  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
  });
});

// 지도 클릭 핸들러 수정
const handleRegionClick = (regionName) => {
  selectedRegion.value = regionName;
  showClubList.value = true;
};
</script>

<template>
  <div v-if="isLocaleReady" class="container mx-auto px-4 py-8">
    <div class="video-background">
      <iframe
        v-if="isYoutubeVideo"
        :src="videoEmbedUrl"
        class="absolute inset-0 w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      <video v-else autoplay muted loop preload="none">
        <source :src="videoEmbedUrl" type="video/mp4" />
      </video>
    </div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-white">{{ $t("clubs.title") }}</h1>
      <UButton
        icon="i-ri-kakao-talk-fill"
        color="yellow"
        :to="QNA_URL"
        target="_blank"
        size="lg"
      >
        {{ $t("clubs.qna") }}
      </UButton>
    </div>

    <div class="map-container backdrop-blur-sm bg-white/30">
      <div ref="mapContainer" class="w-full overflow-hidden"></div>
    </div>

    <clublistmodal
      v-model:showClubList="showClubList"
      :selectedRegion="selectedRegion"
    />
  </div>
</template>

<style scoped>
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
  background: rgba(0, 0, 0, 0.7);
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

.region {
  cursor: pointer;
  transition: all 0.3s ease;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1));
}

.region.active {
  fill: #4a90e2;
  opacity: 0.8;
}

.region.active:hover {
  fill: #357abd;
  opacity: 1;
  transform: translateY(-2px);
}

.region.inactive {
  fill: #e8e8e8;
  cursor: default;
}

.region.selected {
  fill: #2c5282;
  opacity: 1;
}

.map-container {
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.2) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 모바일 환경을 위한 스타일 추가 */
@media (max-width: 768px) {
  .map-container {
    padding: 1rem;
    margin: -1rem;
  }
}
</style>
