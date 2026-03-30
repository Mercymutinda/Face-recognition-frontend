// src/stores/attendanceStore.js
import { defineStore } from "pinia";
import { attendanceService } from "@/services/attendanceService";

export const useAttendanceStore = defineStore("attendance", {
  state: () => ({
    history: [],
    userAttendance: [],
    loading: false,
  }),

  actions: {
    async scanFace(payload) {
      return await attendanceService.scan(payload);
    },

    async fetchHistory(params = {}) {
      this.loading = true;
      try {
        const { data } = await attendanceService.getHistory(params);
        this.history = data.items || data;
      } finally {
        this.loading = false;
      }
    },

    async fetchUserAttendance(userId) {
      const { data } = await attendanceService.getUserAttendance(userId);
      this.userAttendance = data;
    },
  },
});