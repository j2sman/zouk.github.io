<script setup>
import { AddressType } from "~/database/clubinfo";
import { LOCATION_NAME_MAPPING, MAP_ICONS } from "~/constants/commonvars";
import { getLocationKey } from "~/constants/commoncomputed";
import { getTranslatedText } from "~/utils/media";

const props = defineProps({
  showBarList: {
    type: Boolean,
    required: true,
  },
  selectedRegion: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:showBarList"]);

const toast = useToast();
const { copy } = useClipboard();
const { t, locale } = useI18n();
const { $device } = useNuxtApp();
const barStore = useBarStore();

// Add mapIcons ref
const mapIcons = ref(MAP_ICONS);

// getTranslatedText 호출 시 안전하게 처리
const safeGetTranslatedText = (bar, field) => {
  return getTranslatedText(bar, field, locale.value);
};

// 지역 이름을 현재 locale에 맞게 변환하는 computed 속성
const localizedSelectedRegion = computed(() => {
  if (!props.selectedRegion) return "";
  const locationKey = getLocationKey(props.selectedRegion);
  return (
    LOCATION_NAME_MAPPING[locationKey]?.[locale.value] || props.selectedRegion
  );
});

// 필터링된 바 목록
const filteredBars = computed(() => {
  if (!props.selectedRegion) return barStore.totalBars;
  const locationKey = getLocationKey(props.selectedRegion);
  return barStore.totalBars.filter((bar) => {
    const normalizedBarLocation = String(bar.location).trim().toLowerCase();
    const normalizedLocation = String(locationKey).trim().toLowerCase();
    return normalizedBarLocation === normalizedLocation;
  });
});
</script>

<template>
  <ClientOnly>
    <UModal
      :model-value="showBarList"
      @update:model-value="emit('update:showBarList', $event)"
    >
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-semibold">
              {{ localizedSelectedRegion }}
            </h2>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              @click="emit('update:showBarList', false)"
            />
          </div>
        </template>

        <UPageGrid
          :ui="{
            wrapper:
              'grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 2xl:grid-cols-1 gap-4',
          }"
        >
          <UPageCard
            v-for="bar in filteredBars"
            :key="bar.id"
            :title="safeGetTranslatedText(bar, 'name')"
            :description="safeGetTranslatedText(bar, 'description')"
            class="bar-item"
          >
            <!-- address 정보 추가 -->
            <div class="text-base text-gray-600 mb-2 flex items-center gap-2">
              {{ safeGetTranslatedText(bar, "address") }}
              <UButton
                icon="i-heroicons-clipboard"
                color="gray"
                variant="ghost"
                size="xs"
                @click="
                  () => {
                    copy(safeGetTranslatedText(bar, 'address'));
                    toast.add({
                      title: t('bars.addressCopied'),
                      icon: 'i-heroicons-clipboard-document-check',
                      timeout: 2000,
                    });
                  }
                "
              />
            </div>
            <template #footer>
              <div class="flex gap-2">
                <UButton
                  v-for="url in bar.urls"
                  :key="url.id"
                  :icon="mapIcons[url.address_type].icon"
                  :color="mapIcons[url.address_type].color"
                  :to="url.url_address"
                  target="_blank"
                  size="sm"
                >
                  {{ url.address_type }}
                </UButton>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </UCard>
    </UModal>
  </ClientOnly>
</template>

<style scoped>
:deep(.modal-container) {
  max-width: 95vw;
  width: 1600px;
  max-height: 95vh;
  overflow-y: auto;
}

:deep(.modal-card) {
  max-height: 100%;
  padding: 2rem;
}

:deep(.u-button) {
  position: relative;
  z-index: 4;
  pointer-events: auto;
  opacity: 1;
  background-color: rgba(255, 255, 255, 1);
  backdrop-filter: blur(4px);
}
</style>
