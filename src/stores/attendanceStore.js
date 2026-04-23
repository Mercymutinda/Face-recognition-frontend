import { defineStore } from "pinia";
import api from "@/utils/api";
import { useAlert } from "@/composables/alerts";

export const useAttendanceStore = defineStore("attendance", {
  state: () => ({
    sessions: [], // For Admin/Lecturer
    history: [],  // For Student
    loading: false,
  }),

  actions: {
    // Admin / Lecturer: Fetch active sessions
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

    // Admin / Lecturer: End a session
    async endSession(sessionId) {
      try {
        await api.patch(`/academic/sessions/${sessionId}/end`);
        useAlert().toastSuccess("Success", "Session successfully ended.");
        await this.fetchSessions(); 
      } catch (err) {
        useAlert().toastError("Error", "Could not end session.");
      }
    },

    // Student: Fetch personal attendance history
    async fetchHistory(params = {}) {
      this.loading = true;
      try {
        const { data } = await api.get("/attendance/my-history", { params });
        this.history = data.items || data;
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        this.loading = false;
      }
    }
  }
});