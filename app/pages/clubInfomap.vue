<script setup>
import { Location, UrlType } from "~/database/clubinfo";
import * as d3 from "d3";
import {
  CLUBINFO_BACKGROUND_VIDEO,
  VIDEO_OPACITY,
  QNA_URL,
  locationMapping,
  SOCIAL_ICONS,
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
const youtubeEmbedUrl = getEmbedUrl(backgroundVideo.value);

// locale이 준비되었는지 확인하는 computed 속성 추가
const isLocaleReady = computed(() => !!locale.value);

// 지도 관련 상태 추가
const selectedRegion = ref(null);
const mapContainer = ref(null);

// 클럽 목록 표시 상태 추가
const showClubList = ref(false);

// 컴포넌트 마운트 시 클럽 데이터 가져오기
onBeforeMount(() => {
  clubStore.fetchClubs();
});

// 지도 초기화 함수
const initMap = async () => {
  // 컨테이너의 실제 크기를 가져옵니다
  const containerWidth = mapContainer.value.clientWidth;
  const containerHeight = window.innerHeight * 0.7; // 화면 높이의 70% 사용

  const svg = d3
    .select(mapContainer.value)
    .append("svg")
    .attr("width", "100%")
    .attr("height", containerHeight)
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`);

  try {
    // 압축된 GeoJSON 데이터 로드
    const koreaMap = await loadKoreaMap();

    // 지도 프로젝션 설정 - 크기에 맞게 조정
    const projection = d3
      .geoMercator()
      .center([127.5, 36])
      .scale(containerWidth * 5) // 컨테이너 크기에 비례하여 스케일 조정
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
      .attr("stroke", "#fff")
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
      .attr("class", "region-label")
      .attr("transform", (d) => {
        const locationKey = getLocationKey(d.properties.name);
        const regionData = labelOffsets[locationKey];
        const centroid = path.centroid(d);
        const offset = regionData ?? [0, 0];
        // if (import.meta.dev) {
        //   console.log(
        //     `regionData : ${JSON.stringify(regionData)}, offset: ${offset}`
        //   );
        // }
        return `translate(${centroid[0] + offset[0]}, ${
          centroid[1] + offset[1]
        })`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text((d) => {
        const locationKey = getLocationKey(d.properties.name);
        return (
          locationMapping[locationKey]?.[locale.value] || d.properties.name
        );
      })
      .attr("font-size", "14px")
      .attr("fill", "#000")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", "0.5px")
      .attr("paint-order", "stroke")
      .style("font-weight", "600")
      .style("cursor", "pointer")
      .attr("pointer-events", "all")
      .on("click", (event, d) => {
        handleRegionClick(d.properties.name);
      });
  } catch (error) {
    console.error("지도 데이터 로드 실패:", error);
  }
};

// 컴포넌트 마운트 시 지 초기화
onMounted(() => {
  initMap();
  // ... existing onMounted code ...
});

// 화면 크기 변경 시 지도 다시 그리기
onMounted(() => {
  const handleResize = () => {
    d3.select(mapContainer.value).select("svg").remove();
    initMap();
  };

  window.addEventListener("resize", handleResize);
  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
  });
});

const labelOffsets = {
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

    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold">{{ $t("clubs.title") }}</h1>
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

    <!-- 지도 컨테이너 위에 메시지 추가 -->
    <div class="relative">
      <div
        ref="mapContainer"
        class="w-full border rounded-lg overflow-hidden"
      ></div>
    </div>

    <!-- 클럽 목록 모달 -->
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
  background: rgba(0, 0, 0, 0.7); /* 여기서 투명도 조절 (0.2 = 60% 투명) */
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
</style>
