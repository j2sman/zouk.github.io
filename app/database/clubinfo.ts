import { SupabaseClient } from "@supabase/supabase-js";

// 지원 언어 타입
export type SupportedLanguage = "ko" | "en";

// 기본 ClubInfo 타입
export interface ClubInfo {
  id: string;
  default_language: SupportedLanguage;
  url_homepage: string | null;
  url_youtube: string | null;
  url_instagram: string | null;
  url_facebook: string | null;
  id_kakaotalk: string | null;
  url_background: string | null;
  created_at: string;
  updated_at: string;
}

// 다국어 정보 타입
export interface ClubInfoTranslation {
  id: string;
  club_id: string;
  language: SupportedLanguage;
  club_name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// 전체 다국어 정보를 포함한 ClubInfo 타입
export interface ClubInfoWithTranslations extends ClubInfo {
  translations: {
    [key in SupportedLanguage]?: {
      club_name: string;
      description: string;
    };
  };
}

// 응답 타입 정의
export interface ClubInfoWithTranslationsResponse {
  data: ClubInfoWithTranslations | null;
  error: Error | null;
}

export interface ClubInfoWithTranslationsListResponse {
  data: ClubInfoWithTranslations[];
  error: Error | null;
}

export class ClubInfoWithTranslationsService {
  private readonly supabase: SupabaseClient;
  // 테이블명은 기본적으로 소문자임
  private readonly clubTableName = "ClubInfo".toLowerCase();
  private readonly i18nTableName = "ClubInfoI18n".toLowerCase();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * 모든 클럽 정보와 해당하는 모든 번역을 조회
   */
  async getAllClubsWithTranslations(): Promise<ClubInfoWithTranslationsListResponse> {
    try {
      // 기본 클럽 정보와 번역 정보를 함께 조회
      const { data: clubsData, error: clubsError } = await this.supabase
        .from(this.clubTableName)
        .select(
          `
            *,
            translations:${this.i18nTableName} (
              id,
              language,
              club_name,
              description
            )
          `
        )
        .order("created_at", { ascending: false });

      if (clubsError) throw clubsError;

      // 데이터 구조 변환
      const formattedData = clubsData.map((club: ClubInfoWithTranslations) => {
        const translations: ClubInfoWithTranslations["translations"] = {};

        // translations 배열을 객체로 변환
        (club.translations as ClubInfoTranslation[]).forEach((trans) => {
          translations[trans.language] = {
            club_name: trans.club_name,
            description: trans.description,
          };
        });

        return {
          id: club.id,
          default_language: club.default_language,
          url_homepage: club.url_homepage,
          url_youtube: club.url_youtube,
          url_instagram: club.url_instagram,
          url_facebook: club.url_facebook,
          url_background: club.url_background,
          id_kakaotalk: club.id_kakaotalk,
          created_at: club.created_at,
          updated_at: club.updated_at,
          translations,
        };
      });

      return { data: formattedData, error: null };
    } catch (error) {
      console.error("Error fetching clubs with translations:", error);
      return { data: [], error: error as Error };
    }
  }

  /**
   * ID로 특정 클럽의 모든 번역 정보 조회
   */
  async getClubWithTranslationsById(
    id: string
  ): Promise<ClubInfoWithTranslationsResponse> {
    try {
      const { data, error } = await this.supabase
        .from(this.clubTableName)
        .select(
          `
            *,
            translations:${this.i18nTableName} (
              id,
              language,
              club_name,
              description
            )
          `
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      // 데이터 구조 변환
      const translations: ClubInfoWithTranslations["translations"] = {};

      // translations 배열을 객체로 변환
      (data.translations as ClubInfoTranslation[]).forEach((trans) => {
        translations[trans.language] = {
          club_name: trans.club_name,
          description: trans.description,
        };
      });

      const formattedData: ClubInfoWithTranslations = {
        id: data.id,
        default_language: data.default_language,
        url_homepage: data.url_homepage,
        url_youtube: data.url_youtube,
        url_instagram: data.url_instagram,
        url_facebook: data.url_facebook,
        url_background: data.url_background,
        id_kakaotalk: data.id_kakaotalk,
        created_at: data.created_at,
        updated_at: data.updated_at,
        translations,
      };

      return { data: formattedData, error: null };
    } catch (error) {
      console.error("Error fetching club with translations by ID:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * 클럽명으로 검색 (모든 언어의 클럽명에서 검색)
   */
  async searchClubsWithTranslations(
    searchTerm: string
  ): Promise<ClubInfoWithTranslationsListResponse> {
    try {
      // 먼저 i18n 테이블에서 검색어와 매칭되는 club_id들을 찾음
      const { data: matchingClubIds, error: searchError } = await this.supabase
        .from(this.i18nTableName)
        .select("club_id")
        .ilike("club_name", `%${searchTerm}%`)
        .distinct();

      if (searchError) throw searchError;

      // 매칭된 club_id가 없으면 빈 배열 반환
      if (!matchingClubIds.length) {
        return { data: [], error: null };
      }

      // 매칭된 club_id들로 전체 정보 조회
      const { data: clubsData, error: clubsError } = await this.supabase
        .from(this.clubTableName)
        .select(
          `
            *,
            translations:${this.i18nTableName} (
              id,
              language,
              club_name,
              description
            )
          `
        )
        .in(
          "id",
          matchingClubIds.map((item) => item.club_id)
        )
        .order("created_at", { ascending: false });

      if (clubsError) throw clubsError;

      // 데이터 구조 변환
      const formattedData = clubsData.map((club) => {
        const translations: ClubInfoWithTranslations["translations"] = {};

        (club.translations as ClubInfoTranslation[]).forEach((trans) => {
          translations[trans.language] = {
            club_name: trans.club_name,
            description: trans.description,
          };
        });

        return {
          id: club.id,
          default_language: club.default_language,
          url_homepage: club.url_homepage,
          url_youtube: club.url_youtube,
          url_instagram: club.url_instagram,
          url_facebook: club.url_facebook,
          url_background: club.url_background,
          id_kakaotalk: club.id_kakaotalk,
          created_at: club.created_at,
          updated_at: club.updated_at,
          translations,
        };
      });

      return { data: formattedData, error: null };
    } catch (error) {
      console.error("Error searching clubs with translations:", error);
      return { data: [], error: error as Error };
    }
  }
}
