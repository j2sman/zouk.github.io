<script setup>
import { Location } from "~/database/clubinfo";
import * as d3 from "d3";
import { VIDEO_OPACITY, QNA_URL } from "~/constants/commonvars";
import { loadKoreaMap } from "~/utils/map";
import {
  getMediaType,
  getBackgroundConfig,
  getEmbedUrl,
  getUrlByType,
} from "~/utils/media";
import { UrlType } from "~/database/clubinfo";
import { getSocialMediaLinks, getTranslatedText } from "~/utils/media";
import { SOCIAL_ICONS } from "~/constants/commonvars";

const { t, locale } = useI18n();
const clubStore = useClubStore();
const { $device } = useNuxtApp();

// 비디오 재생 관리를 위한 ref 추가
const videoRefs = ref({});
const iframeRefs = ref({});

// 지도 관련 상태 추가
const selectedRegion = ref(null);
const mapContainer = ref(null);

// 클럽 목록 표시 상태 추가
const showClubList = ref(false);

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

// 필터링된 클럽 목록
const filteredClubs = computed(() => {
  if (!selectedRegion.value) return clubsByLocation;
  const locationKey = Object.entries(locationMapping).find(
    ([_, value]) => value === selectedRegion.value
  )?.[0];
  // if (import.meta.dev) {
  //   console.log(
  //     `locationKey : ${locationKey}, clubs : ${JSON.stringify(
  //       clubsByLocation.value[locationKey]
  //     )}`
  //   );
  // }
  return clubsByLocation.value[locationKey] || [];
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
        const locationKey = Object.entries(locationMapping).find(
          ([_, value]) => value === d.properties.name
        )?.[0];
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

// 지도 클릭 핸들러 수정
const handleRegionClick = (regionName) => {
  selectedRegion.value = regionName;
  showClubList.value = true; // 클럽 목록 표시
};

// Add socialIcons ref
const socialIcons = ref(SOCIAL_ICONS);

// Add clubMediaTypes computed property from clubInfo.vue
const clubBackgroundMediaTypes = computed(() => {
  const types = {};
  clubStore.totalClubs.forEach((club) => {
    try {
      const backgroundUrl = getUrlByType(club.urls, UrlType.background);
      types[club.id] = getMediaType(backgroundUrl);
    } catch (error) {
      console.error("클럽 미디어 타입 확인 중 오류:", error, {
        clubId: club.id,
      });
      types[club.id] = "none";
    }
  });
  return types;
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

    <!-- 지도 컨테이너 위에 메시지 추가 -->
    <div class="relative">
      <div
        ref="mapContainer"
        class="w-full border rounded-lg overflow-hidden"
      ></div>
    </div>

    <!-- 클럽 목록 모달 -->
    <ClientOnly>
      <UModal v-model="showClubList">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-semibold">{{ selectedRegion }}</h2>
              <UButton
                icon="i-heroicons-x-mark"
                color="gray"
                variant="ghost"
                @click="showClubList = false"
              />
            </div>
          </template>

          <div class="club-list-container">
            <ULandingHero
              v-for="club in filteredClubs"
              :key="club.id"
              size="sm"
              class="club-item mb-4"
              :ui="{
                background: getBackgroundConfig(
                  getUrlByType(club.urls, UrlType.background)
                ),
              }"
            >
              <!-- video background -->
              <video
                v-if="clubBackgroundMediaTypes[club.id] === 'video'"
                :ref="(el) => (videoRefs[club.id] = el)"
                :data-club-id="club.id"
                class="video-background"
                :style="`opacity: ${VIDEO_OPACITY}%`"
                muted
                loop
                playsinline
              >
                <source
                  :src="getUrlByType(club.urls, UrlType.background)"
                  type="video/mp4"
                />
              </video>

              <!-- iframe background -->
              <iframe
                v-if="
                  ['youtube', 'instagram'].includes(
                    clubBackgroundMediaTypes[club.id]
                  )
                "
                :ref="(el) => (iframeRefs[club.id] = el)"
                :data-club-id="club.id"
                :src="getEmbedUrl(getUrlByType(club.urls, UrlType.background))"
                class="video-background"
                :style="`opacity: ${VIDEO_OPACITY}%`"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              />

              <template #title>
                {{ getTranslatedText(club, "club_name") }}
              </template>
              <template #description>
                {{ getTranslatedText(club, "description") }}
              </template>
              <template #links>
                <UButton
                  v-for="url in getSocialMediaLinks(
                    club.urls,
                    $device.isMobile.value.value
                  )"
                  :key="url.type"
                  :icon="socialIcons[url.type].icon"
                  :color="socialIcons[url.type].color"
                  :to="url.value"
                  target="_blank"
                  size="lg"
                />
              </template>
            </ULandingHero>
          </div>
        </UCard>
      </UModal>
    </ClientOnly>
  </div>
</template>

<style scoped>
.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.video-background::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1;
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
  z-index: 0;
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

:deep(.modal-container) {
  max-width: 90vw;
  width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
}

:deep(.modal-card) {
  max-height: 100%;
}

.club-list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.club-item {
  width: 100%;
}

/* 컨텐츠의 z-index 추가 */
:deep(.landing-hero-content) {
  position: relative;
  z-index: 2;
}
</style>
