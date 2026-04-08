import { defineStore } from "pinia";
import { attendanceService } from "@/services/attendanceService";
import { useAlert } from "@/composables/alerts";

export const useAttendanceStore = defineStore("attendance", {
  state: () => ({
    history: [],
    userAttendance: [],
    sessions: [], // Added sessions state
    loading: false,
  }),

  actions: {
    async scanFace(payload) {
      return await attendanceService.scanFaces(payload);
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

    // Added Action: Fetch Sessions
    async fetchSessions(params = {}) {
      this.loading = true;
      try {
        const { data } = await attendanceService.getSessions(params);
        this.sessions = data.items || data;
      } catch (err) {
        const { toastError } = useAlert();
        toastError("Error", "Failed to fetch attendance sessions.");
      } finally {
        this.loading = false;
      }
    },

    // Added Action: End Session
    async endSession(sessionId) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await attendanceService.endSession(sessionId);
        toastSuccess("Success", "Session successfully ended.");
        await this.fetchSessions(); // Refresh the table
      } catch (err) {
        toastError("Error", "Could not end session.");
      }
    }
  },
});