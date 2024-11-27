import { defineStore } from "pinia";
import { ClubInfoExtService } from "~/database/clubinfo";
import type { ClubInfoExt } from "~/database/clubinfo";
import { useI18n } from "#imports";

export const useClubStore = defineStore("club", {
  state: () => ({
    selectedClubId: null as string | null,
    selectedClub: null as ClubInfoExt | null,
    totalClubs: [] as ClubInfoExt[],
  }),

  actions: {
    async fetchClubs() {
      const supabase = useSupabaseClient();
      const clubService = new ClubInfoExtService(supabase);
      const { locale } = useI18n();

      const { data: clubsData, error } =
        await clubService.getAllClubsWithTranslations();

      if (error) {
        console.error("클럽 데이터를 불러오는데 실패했습니다:", error);
        return;
      }

      this.totalClubs = clubsData;
      if (import.meta.dev) {
        console.log(`this.totalClubs:\n${JSON.stringify(this.totalClubs)}`); // URL 데이터 로깅
      }
    },

    setSelectedClub(clubId: string) {
      this.selectedClubId = clubId;
      this.selectedClub =
        this.totalClubs.find((club) => club.id === clubId) || null;
    },
  },

  getters: {
    clubOptions: (state) => {
      const { locale } = useI18n();
      return state.totalClubs.map((club) => ({
        label:
          club.translations[locale.value as keyof typeof club.translations]
            ?.club_name || "",
        value: club.id,
      }));
    },

    hasClubsInLocation: (state) => {
      return (location: string) => {
        if (!location) return false;

        return state.totalClubs.some((club) => {
          const normalizedClubLocation = String(club.location)
            .trim()
            .toLowerCase();
          const normalizedLocation = String(location).trim().toLowerCase();

          // if (import.meta.dev) {
          //   console.log("Comparing locations:", {
          //     clubLocation: normalizedClubLocation,
          //     searchLocation: normalizedLocation,
          //   });
          // }

          return normalizedClubLocation === normalizedLocation;
        });
      };
    },
  },
});

// 새로운 컴포저블 함수
export const useClubOptions = () => {
  const store = useClubStore();
  const { t } = useI18n();
  const clubOptionsWithEmpty = computed(() => [
    { label: t("clubs.select"), value: null },
    ...store.clubOptions,
  ]);
  return {
    clubOptions: clubOptionsWithEmpty,
  };
};
