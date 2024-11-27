import { SupabaseClient } from "@supabase/supabase-js";

// 지원 언어 타입
export enum SupportedLanguage {
  ko = "ko",
  en = "en",
}

// 지원 언어 타입
export enum UrlType {
  homepage = "Homepage",
  youtube = "Youtube",
  instagram = "Instagram",
  facebook = "Facebook",
  kakaotalk = "Kakaotalk",
  background = "Background",
}

// 지원 언어 타입
export enum Location {
  seoul = "Seoul",
  gyeonggi = "Gyeonggi",
  incheon = "Incheon",
  gangwon = "Gangwon",
  chungbuk = "Chungbuk",
  chungnam = "Chungnam",
  busan = "Busan",
}

export interface ClubUrl {
  id: string;
  club_id: string;
  type: UrlType;
  value: string;
  created_at: string;
  updated_at: string;
}

// 기본 ClubInfo 타입
export interface ClubInfo {
  id: string;
  default_language: SupportedLanguage;
  location: Location;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 전체 다국어 정보를 포함한 ClubInfo 타입
export interface ClubInfoExt extends ClubInfo {
  translations: {
    [key in SupportedLanguage]?: {
      club_name: string;
      description: string;
    };
  };
}

// 응답 타입 정의
export interface ClubInfoExtResponse {
  data: ClubInfoExt | null;
  error: Error | null;
}

export interface ClubInfoExtListResponse {
  data: ClubInfoExt[];
  error: Error | null;
}

export class ClubInfoExtService {
  private readonly supabase: SupabaseClient;
  private readonly clubTableName = "clubinfo".toLowerCase();
  private readonly i18nTableName = "clubinfoi18n".toLowerCase();
  private readonly urlTableName = "cluburls".toLowerCase();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * 모든 클럽 정보와 해당하는 모든 번역을 조회
   */
  async getAllClubsWithTranslations(): Promise<ClubInfoExtListResponse> {
    try {
      const { data: clubsData, error: clubsError } = await this.supabase
        .from(this.clubTableName)
        .select(
          `
          *,
          translations:${this.i18nTableName}!club_id(
            id,
            language,
            club_name,
            description
          ),
          urls:${this.urlTableName}!club_id(
            id,
            type,
            value
          )
        `
        )
        .order("display_order", { ascending: true });

      if (clubsError) throw clubsError;

      // if (import.meta.dev) {
      //   console.log(`clubsData:\n${JSON.stringify(clubsData)}`); // URL 데이터 로깅
      // }

      // 데이터 구조 변환
      const formattedData = clubsData.map((club: any) => {
        const translations: ClubInfoExt["translations"] = {};

        (club.translations as ClubInfoExt[]).forEach((trans) => {
          translations[trans.language] = {
            club_name: trans.club_name,
            description: trans.description,
          };
        });

        return {
          id: club.id,
          default_language: club.default_language,
          created_at: club.created_at,
          updated_at: club.updated_at,
          location: club.location,
          translations,
          urls: club.urls,
        };
      });

      return { data: formattedData, error: null };
    } catch (error) {
      console.error("Error fetching clubs with translations:", error);
      return { data: [], error: error as Error };
    }
  }

  /**
   * 클럽명으로 검색 (모든 언어의 클럽명에서 검색)
   */
  async searchClubsWithTranslations(
    searchTerm: string
  ): Promise<ClubInfoExtListResponse> {
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
          translations:${this.i18nTableName}!club_id(
            id,
            language,
            club_name,
            description
          ),
          urls:${this.urlTableName}!club_id(
            id,
            type,
            value
          )
        `
        )
        .in(
          "id",
          matchingClubIds.map((item) => item.club_id)
        )
        .order("display_order", { ascending: true });

      if (clubsError) throw clubsError;

      // 데이터 구조 변환
      const formattedData = clubsData.map((club) => {
        const translations: ClubInfoExt["translations"] = {};

        (club.translations as ClubInfoExt[]).forEach((trans) => {
          translations[trans.language] = {
            club_name: trans.club_name,
            description: trans.description,
          };
        });

        return {
          id: club.id,
          default_language: club.default_language,
          created_at: club.created_at,
          updated_at: club.updated_at,
          location: club.location,
          translations,
          urls: club.urls,
        };
      });

      return { data: formattedData, error: null };
    } catch (error) {
      console.error("Error searching clubs with translations:", error);
      return { data: [], error: error as Error };
    }
  }
}
