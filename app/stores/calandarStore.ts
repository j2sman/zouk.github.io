import { defineStore } from "pinia";
import { ClubInfoExtService } from "~/database/clubinfo";
import type { CalendarList } from "~/database/clubinfo";

export const useCalendarStore = defineStore("calendar", {
  state: () => ({
    calendarList: [] as CalendarList[],
  }),

  actions: {
    async fetchCalendarList() {
      const supabase = useSupabaseClient();
      const clubService = new ClubInfoExtService(supabase);
      const { data: calendarList, error } = await clubService.getCalendarList();

      if (error) {
        console.error("캘린더 목록을 불러오는데 실패했습니다:", error);
        return;
      }

      this.calendarList = calendarList || [];
    },
  },
});
