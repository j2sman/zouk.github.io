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
  background = "Background",
  naverband = "Naverband",
  navercafe = "Navercafe",
  daumcafe = "Daumcafe",
  kakaotalk = "Kakaotalk",
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
  daegu = "Daegu",
  gwangju = "Gwangju",
  daejeon = "Daejeon",
  ulsan = "Ulsan",
  sejong = "Sejong",
  jeonbuk = "Jeonbuk",
  jeonnam = "Jeonnam",
  gyeongbuk = "Gyeongbuk",
  gyeongnam = "Gyeongnam",
  jeju = "Jeju",
}

export enum AddressType {
  naver = "Naver",
  google = "Google",
}

export interface CalendarList {
  id: string;
  calendar_id: string;
  enabled: boolean;
  created_at: string;
}

export interface ClubUrl {
  id: string;
  club_id: string;
  type: UrlType;
  value: string;
  additional_info: string;
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
export interface CalendarListResponse {
  data: CalendarList[] | null;
  error: Error | null;
}

export interface ClubInfoExtResponse {
  data: ClubInfoExt | null;
  error: Error | null;
}

export interface ClubInfoExtListResponse {
  data: ClubInfoExt[];
  error: Error | null;
}

// 라틴바 기본 정보 타입
export interface BarInfo {
  id: string;
  location: Location;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 라틴바 전체 정보 타입
export interface BarInfoExt extends BarInfo {
  translations: {
    [key in SupportedLanguage]?: {
      name: string;
      address: string;
      description: string;
    };
  };
  urls: BarUrl[];
}

// 라틴바 주소 타입
export interface BarUrl {
  id: string;
  bar_id: string;
  url_address: string;
  address_type: AddressType;
  is_primary: boolean;
}

// 응답 타입 추가
export interface BarInfoExtResponse {
  data: BarInfoExt | null;
  error: Error | null;
}

export interface BarInfoExtListResponse {
  data: BarInfoExt[];
  error: Error | null;
}

export class ClubInfoExtService {
  private readonly supabase: SupabaseClient;
  private readonly calendarTableName = "calendarlist".toLowerCase();
  private readonly clubTableName = "clubinfo".toLowerCase();
  private readonly clubi18nTableName = "clubinfoi18n".toLowerCase();
  private readonly cluburlTableName = "cluburls".toLowerCase();
  private readonly barTableName = "barinfo".toLowerCase();
  private readonly barI18nTableName = "barinfoi18n".toLowerCase();
  private readonly barUrlTableName = "barinfourl".toLowerCase();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getCalendarList(): Promise<CalendarListResponse> {
    try {
      const { data, error } = await this.supabase
        .from(this.calendarTableName)
        .select("*");

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching calendar list:", error);
      return { data: [], error: error as Error };
    }
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
          translations:${this.clubi18nTableName}!club_id(
            id,
            language,
            club_name,
            description
          ),
          urls:${this.cluburlTableName}!club_id(
            id,
            type,
            value,
            additional_info
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
        .from(this.clubi18nTableName)
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
          translations:${this.clubi18nTableName}!club_id(
            id,
            language,
            club_name,
            description
          ),
          urls:${this.cluburlTableName}!club_id(
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

  async getAllBarsWithTranslations(): Promise<BarInfoExtListResponse> {
    try {
      const { data: barsData, error: barsError } = await this.supabase
        .from(this.barTableName)
        .select(
          `
          *,
          translations:${this.barI18nTableName}!bar_id(
            id,
            language_code,
            name,
            address,
            description
          ),
          urls:${this.barUrlTableName}!bar_id(
            id,
            url_address,
            address_type,
            is_primary
          )
        `
        )
        .order("display_order", { ascending: true });

      if (barsError) throw barsError;

      const formattedData = barsData.map((bar: any) => {
        const translations: BarInfoExt["translations"] = {};

        bar.translations.forEach((trans: any) => {
          translations[trans.language_code as SupportedLanguage] = {
            name: trans.name,
            address: trans.address,
            description: trans.description,
          };
        });

        return {
          id: bar.id,
          location: bar.location,
          display_order: bar.display_order,
          created_at: bar.created_at,
          updated_at: bar.updated_at,
          translations,
          urls: bar.urls,
        };
      });

      return { data: formattedData, error: null };
    } catch (error) {
      console.error("Error fetching bars with translations:", error);
      return { data: [], error: error as Error };
    }
  }
}
