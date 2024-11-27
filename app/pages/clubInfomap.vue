<script setup>
import { Location } from "~/database/clubinfo";
import * as d3 from "d3";
import { VIDEO_OPACITY, QNA_URL } from "~/constants/commonvars";

const { t, locale } = useI18n();
const clubStore = useClubStore();
const { $device } = useNuxtApp();

// 비디오 재생 관리를 위한 ref 추가
const videoRefs = ref({});
const iframeRefs = ref({});

// 지도 관련 상태 추가
const selectedRegion = ref(null);
const mapContainer = ref(null);

// 컴포넌트 마운트 시 클럽 데이터 가져오기
onBeforeMount(() => {
  clubStore.fetchClubs();
});

// 지역별로 클럽 그룹화
const clubsByLocation = computed(() => {
  const grouped = {};
  Object.values(Location).forEach((location) => {
    grouped[location] = clubStore.totalClubs.filter((club) => {
      const normalizedClubLocation = String(club.location).trim().toLowerCase();
      const normalizedLocation = String(location).trim().toLowerCase();

      // if (process.env.NODE_ENV === "development") {
      //   console.log(
      //     `Comparing - Club: "${normalizedClubLocation}", Location: "${normalizedLocation}"`
      //   );
      // }

      return normalizedClubLocation === normalizedLocation;
    });
  });

  // if (process.env.NODE_ENV === "development") {
  //   console.log("Grouped clubs:", grouped);
  // }

  return grouped;
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

  // GeoJSON 데이터 로드
  const koreaMap = await fetch("/korea.json").then((res) => res.json());

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
    .attr("class", "region")
    .attr("fill", "#e4e4e4")
    .attr("stroke", "#fff")
    .on("click", (event, d) => {
      selectedRegion.value = d.properties.name;
    });
};

// 컴포넌트 마운트 시 지도 초기화
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

// 필터링된 클럽 목록
const filteredClubs = computed(() => {
  if (!selectedRegion.value) return clubsByLocation;
  return {
    [selectedRegion.value]: clubsByLocation[selectedRegion.value] || [],
  };
});

// Intersection Observer 설정
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const elementId = entry.target.dataset.clubId;
        const video = videoRefs.value[elementId];
        const iframe = iframeRefs.value[elementId];

        if (video) {
          if (entry.isIntersecting) {
            video.play().catch((error) => {
              console.warn("비디오 자동 재생 실패:", error);
            });
          } else {
            video.pause();
          }
        }

        if (iframe) {
          if (entry.isIntersecting) {
            iframe.src = iframe.dataset.src;
          } else {
            iframe.src = "";
          }
        }
      });
    },
    { threshold: 0.1 }
  );

  // 모든 비디오와 iframe 요소 관찰 시작
  setTimeout(() => {
    [
      ...Object.values(videoRefs.value),
      ...Object.values(iframeRefs.value),
    ].forEach((element) => {
      if (element && element.parentElement) {
        observer.observe(element.parentElement);
      }
    });
  }, 100);

  // 컴포넌트 언마운트 시 observer 정리
  onUnmounted(() => {
    observer.disconnect();
  });
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
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

    <!-- 지도 컨테이너 스타일 수정 -->
    <div
      ref="mapContainer"
      class="w-full border rounded-lg overflow-hidden"
    ></div>
  </div>
</template>

<style scoped>
.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.video-background::after {
  position: absolute;
  content: "";
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
}

.video-background video,
.video-background iframe {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  top: 0;
  left: 0;
  transform: none;
}

/* 지도 컨테이너 스타일 추가 */
svg {
  display: block;
  max-width: 100%;
  height: auto;
}

.region {
  cursor: pointer;
  transition: fill 0.2s;
}

.region:hover {
  fill: #bbb;
}

.region.selected {
  fill: #666;
}
</style>
