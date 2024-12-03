import { defineStore } from "pinia";
import { ClubInfoExtService } from "~/database/clubinfo";
import { useI18n } from "#imports";
import type { BarInfoExt } from "~/database/clubinfo";

export const useBarStore = defineStore("bar", {
  state: () => ({
    selectedBarId: null as string | null,
    selectedBar: null as BarInfoExt | null,
    totalBars: [] as BarInfoExt[],
  }),

  actions: {
    async fetchBars() {
      const supabase = useSupabaseClient();
      const barService = new ClubInfoExtService(supabase);

      const { data: barsData, error } =
        await barService.getAllBarsWithTranslations();

      if (error) {
        console.error("라틴바 데이터를 불러오는데 실패했습니다:", error);
        return;
      }

      this.totalBars = barsData;
      if (import.meta.dev) {
        console.log(`this.totalBars:\n${JSON.stringify(this.totalBars)}`); // URL 데이터 로깅
      }
    },

    setSelectedBar(barId: string) {
      this.selectedBarId = barId;
      this.selectedBar = this.totalBars.find((bar) => bar.id === barId) || null;
    },
  },

  getters: {
    barOptions: (state) => {
      const { locale } = useI18n();
      return state.totalBars.map((bar) => ({
        label:
          bar.translations[locale.value as keyof typeof bar.translations]
            ?.name || "",
        value: bar.id,
      }));
    },

    hasBarsInLocation: (state) => {
      return (location: string) => {
        if (!location) return false;

        return state.totalBars.some((bar) => {
          const normalizedBarLocation = String(bar.location)
            .trim()
            .toLowerCase();
          const normalizedLocation = String(location).trim().toLowerCase();

          // if (import.meta.dev) {
          //   console.log("Comparing locations:", {
          //     barLocation: normalizedBarLocation,
          //     searchLocation: normalizedLocation,
          //   });
          // }

          return normalizedBarLocation === normalizedLocation;
        });
      };
    },
  },
});

// 새로운 컴포저블 함수
export const useBarOptions = () => {
  const store = useBarStore();
  const { t } = useI18n();
  const barOptionsWithEmpty = computed(() => [
    { label: t("bars.select"), value: null },
    ...store.barOptions,
  ]);
  return {
    barOptions: barOptionsWithEmpty,
  };
};
