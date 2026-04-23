import { defineStore } from "pinia";
import api from "@/utils/api";
import { useAlert } from "@/composables/alerts";

export const useAttendanceStore = defineStore("attendance", {
  state: () => ({
    sessions: [], // Used by Admin Attendance Logs
    loading: false,
  }),

  actions: {
    // Hits: GET /academic/sessions
    async fetchSessions(params = {}) {
      this.loading = true;
      try {
        const { data } = await api.get("/academic/sessions", { params });
        this.sessions = data.items || data;
      } catch (err) {
        useAlert().toastError("Error", "Failed to fetch attendance sessions.");
      } finally {
        this.loading = false;
      }
    },

    // Hits: PATCH /academic/sessions/{session_id}/end
    async endSession(sessionId) {
      try {
        await api.patch(`/academic/sessions/${sessionId}/end`);
        useAlert().toastSuccess("Success", "Session successfully ended.");
        await this.fetchSessions(); 
      } catch (err) {
        useAlert().toastError("Error", "Could not end session.");
      }
    }
  }
});