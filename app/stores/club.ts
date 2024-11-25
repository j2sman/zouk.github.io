import { defineStore } from "pinia";
import { ClubInfoWithTranslationsService } from "~/database/clubinfo";

interface Club {
  id: string;
  name: string;
  description: string;
  background: string | null;
  urls: {
    homepage: string | null;
    youtube: string | null;
    instagram: string | null;
    facebook: string | null;
    kakaotalk: string | null;
  };
}

export const useClubStore = defineStore("club", {
  state: () => ({
    selectedClubId: null as string | null,
    selectedClub: null as Club | null,
    totalClubs: [] as Club[],
  }),

  actions: {
    async fetchClubs() {
      const supabase = useSupabaseClient();
      const clubService = new ClubInfoWithTranslationsService(supabase);
      const { locale } = useI18n();

      const { data: clubsData, error } =
        await clubService.getAllClubsWithTranslations();

      if (error) {
        console.error("클럽 데이터를 불러오는데 실패했습니다:", error);
        return;
      }

      this.totalClubs = clubsData.map((club) => ({
        id: club.id,
        name: club.translations[locale.value]?.club_name || "",
        description: club.translations[locale.value]?.description || "",
        background: club.url_background,
        urls: {
          homepage: club.url_homepage,
          youtube: club.url_youtube,
          instagram: club.url_instagram,
          facebook: club.url_facebook,
          kakaotalk: club.id_kakaotalk,
        },
      }));
    },

    setSelectedClub(clubId: string) {
      this.selectedClubId = clubId;
      this.selectedClub =
        this.totalClubs.find((club) => club.id === clubId) || null;
    },
  },

  getters: {
    // 기본 클럽 옵션만 반환
    clubOptions: (state) =>
      state.totalClubs.map((club) => ({
        label: club.name,
        value: club.id,
      })),
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
