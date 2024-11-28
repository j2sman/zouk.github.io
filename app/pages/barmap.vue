<script setup>
import { Location, UrlType } from "~/database/clubinfo";
import * as d3 from "d3";
import {
  VIDEO_OPACITY,
  QNA_URL,
  LOCATION_NAME_MAPPING,
  SOCIAL_ICONS,
  LOCATION_LABEL_OFFSETS,
} from "~/constants/commonvars";
import { getLocationKey } from "~/constants/commoncomputed";
import { loadKoreaMap } from "~/utils/map";
import barlistmodal from "~/components/barlistmodal.vue";

const { t, locale } = useI18n();
const barStore = useBarStore();
const { $device } = useNuxtApp();

// locale이 준비되었는지 확인하는 computed 속성
const isLocaleReady = computed(() => !!locale.value);

// 지도 관련 상태
const selectedRegion = ref(null);
const mapContainer = ref(null);

// 바 목록 표시 상태
const showBarList = ref(false);

// 컴포넌트 마운트 시 바 데이터 가져오기
onBeforeMount(() => {
  barStore.fetchBars();
});

// 지도 초기화 함수
const initMap = async () => {
  const containerWidth = mapContainer.value.clientWidth;
  const containerHeight = $device.isMobile
    ? window.innerHeight * 0.9
    : window.innerHeight * 0.7;

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
      .center([127.5, 35.5])
      .scale(mapScale)
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
        const hasBars = barStore.hasBarsInLocation(locationKey);
        return `region ${
          selectedRegion.value === d.properties.name ? "selected" : ""
        } ${hasBars ? "active" : "inactive"}`;
      })
      .attr("fill", (d) => {
        const locationKey = getLocationKey(d.properties.name);
        return barStore.hasBarsInLocation(locationKey) ? "#e4e4e4" : "#f5f5f5";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", "1.5")
      .on("click", (event, d) => {
        const locationKey = getLocationKey(d.properties.name);
        const hasBars = barStore.hasBarsInLocation(locationKey);
        if (hasBars) {
          handleRegionClick(d.properties.name);
        }
      });

    // 지역명 레이블 추가
    svg
      .selectAll("text")
      .data(
        koreaMap.features.filter((d) => {
          const locationKey = getLocationKey(d.properties.name);
          return barStore.hasBarsInLocation(locationKey);
        })
      )
      .enter()
      .append("text")
      .attr("class", "region-label")
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
      .attr("fill", "#333333")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", "2px")
      .attr("paint-order", "stroke")
      .style("font-weight", "700")
      .style("cursor", "pointer")
      .style("text-shadow", "2px 2px 4px rgba(0,0,0,0.2)")
      .attr("pointer-events", "all")
      .on("click", (event, d) => {
        handleRegionClick(d.properties.name);
      });
  } catch (error) {
    console.error("지도 데이터 로드 실패:", error);
  }
};

// 컴포넌트 마운트 시 지도 초기화
onMounted(() => {
  initMap();
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

// 지도 클릭 핸들러
const handleRegionClick = (regionName) => {
  selectedRegion.value = regionName;
  showBarList.value = true;
};
</script>

<template>
  <div v-if="isLocaleReady" class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold">{{ $t("bars.title") }}</h1>
    </div>

    <div class="map-container backdrop-blur-sm bg-white/30">
      <div ref="mapContainer" class="w-full overflow-hidden"></div>
    </div>

    <!-- 바 목록 모달 -->
    <barlistmodal
      v-model:showBarList="showBarList"
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

.region-label {
  transition: all 0.3s ease;
  font-family: "Noto Sans KR", sans-serif;
}

.region-label:hover {
  font-size: 16px;
  font-weight: 800;
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
