<script setup>
import { Location } from "~/database/clubinfo";
import * as d3 from "d3";
import { VIDEO_OPACITY, QNA_URL } from "~/constants/commonvars";
import { loadKoreaMap } from "~/utils/map";

const { t, locale } = useI18n();
const clubStore = useClubStore();
const { $device } = useNuxtApp();

// 비디오 재생 관리를 위한 ref 추가
const videoRefs = ref({});
const iframeRefs = ref({});

// 지도 관련 상태 추가
const selectedRegion = ref(null);
const mapContainer = ref(null);
const showMessage = ref(false); // 메시지 표시 상태 추가

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

      // if (import.meta.dev) {
      //   console.log(
      //     `Comparing - Club: "${normalizedClubLocation}", Location: "${normalizedLocation}"`
      //   );
      // }

      return normalizedClubLocation === normalizedLocation;
    });
  });

  // if (import.meta.dev) {
  //   console.log("Grouped clubs:", grouped);
  // }

  return grouped;
});

// 지역 선택 메시지 계산
const regionMessage = computed(() => {
  if (!selectedRegion.value) return "";
  return `${selectedRegion.value} 지역이 선택되었습니다`;
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
        // 지역 이름으로 Location enum 값 찾기
        const locationKey = Object.entries(locationMapping).find(
          ([_, value]) => value === d.properties.name
        )?.[0];
        const hasClubs = clubStore.hasClubsInLocation(locationKey);
        return `region ${
          selectedRegion.value === d.properties.name ? "selected" : ""
        } ${hasClubs ? "active" : "inactive"}`;
      })
      .attr("fill", (d) => {
        const locationKey = Object.entries(locationMapping).find(
          ([_, value]) => value === d.properties.name
        )?.[0];
        return clubStore.hasClubsInLocation(locationKey)
          ? "#e4e4e4"
          : "#f5f5f5";
      })
      .attr("stroke", "#fff")
      .on("click", (event, d) => {
        // clubsByLocation에 있는 지역만 클릭 가능
        const locationKey = Object.entries(locationMapping).find(
          ([_, value]) => value === d.properties.name
        )?.[0];
        const hasClubs = clubStore.hasClubsInLocation(locationKey);
        if (hasClubs) {
          selectedRegion.value = d.properties.name;
          showMessage.value = true;
          setTimeout(() => {
            showMessage.value = false;
          }, 3000);
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
          const locationKey = Object.entries(locationMapping).find(
            ([_, value]) => value === d.properties.name
          )?.[0];
          const hasClubs = clubStore.hasClubsInLocation(locationKey);
          return hasClubs;
        })
      )
      .enter()
      .append("text")
      .attr("class", "region-label")
      .attr("transform", (d) => {
        const locationKey = Object.entries(locationMapping).find(
          ([_, value]) => value === d.properties.name
        )?.[0];
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
      .text((d) => d.properties.name)
      .attr("font-size", "14px")
      .attr("fill", "#000")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", "0.5px")
      .attr("paint-order", "stroke")
      .style("font-weight", "600")
      .style("cursor", "pointer")
      .attr("pointer-events", "all")
      .on("click", (event, d) => {
        selectedRegion.value = d.properties.name;
        showMessage.value = true;
        setTimeout(() => {
          showMessage.value = false;
        }, 3000);
      });
  } catch (error) {
    console.error("지도 데이터 로드 실패:", error);
  }
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

  // 모든 비디오와 iframe 요소 찰 시작
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

const locationMapping = {
  [Location.seoul]: "서울특별시",
  [Location.gyeonggi]: "경기도",
  [Location.incheon]: "인천광역시",
  [Location.gangwon]: "강원도",
  [Location.chungbuk]: "충청북도",
  [Location.chungnam]: "충청남도",
  [Location.busan]: "부산광역시",
  [Location.daegu]: "대구광역시",
  [Location.gwangju]: "광주광역시",
  [Location.daejeon]: "대전광역시",
  [Location.ulsan]: "울산광역시",
  [Location.sejong]: "세종특별자치시",
  [Location.jeonbuk]: "전라북도",
  [Location.jeonnam]: "전라남도",
  [Location.gyeongbuk]: "경상북도",
  [Location.gyeongnam]: "경상남도",
  [Location.jeju]: "제주특별자치도",
};

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

    <!-- 지도 컨테이너 위에 메시지 추가 -->
    <div class="relative">
      <Transition name="fade">
        <div
          v-if="showMessage && regionMessage"
          class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          {{ regionMessage }}
        </div>
      </Transition>
      <div
        ref="mapContainer"
        class="w-full border rounded-lg overflow-hidden"
      ></div>
    </div>
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

.region.inactive {
  cursor: default;
  pointer-events: none;
}

.region.active:hover {
  fill: #bbb;
}

/* 메시지 트랜지션 스타일 추가 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.region-label {
  user-select: none;
  font-weight: 600;
  text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff,
    1px 1px 0 #fff;
  cursor: pointer;
}
</style>
