import { defineStore } from "pinia";
import api from "@/utils/api";
import { useAlert } from "@/composables/alerts";

export const useExamsStore = defineStore("exams", {
  state: () => ({
    logs: [], // Used by Admin Exam Logs
    loading: false,
  }),

  actions: {
    // Hits: GET /exams/logs
    async fetchLogs(params = {}) {
      this.loading = true;
      try {
        const { data } = await api.get("/exams/logs", { params });
        this.logs = data.items || data;
      } catch (err) {
        useAlert().toastError("Error", "Failed to fetch exam logs.");
      } finally {
        this.loading = false;
      }
    },
    // Hits: GET /exams/lecturer-logs
    async fetchLecturerLogs(params = {}) {
      this.loading = true;
      try {
        const { data } = await api.get("/exams/lecturer-logs", { params });
        this.logs = data.items || data;
      } catch (err) {
        useAlert().toastError("Error", "Failed to fetch lecturer exam logs.");
      } finally {
        this.loading = false;
      }
    },
  }
});