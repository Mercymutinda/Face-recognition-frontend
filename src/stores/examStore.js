// src/stores/examsStore.js
import { defineStore } from "pinia";
import { examsService } from "@/services/examsService";
import { useAlert } from "@/composables/alerts";

export const useExamsStore = defineStore("exams", {
  state: () => ({
    activeExams: [],
    logs: [],
    loading: false,
  }),

  actions: {
    async createExam(payload) {
      return await examsService.createExam(payload);
    },

    async fetchActiveExams() {
      this.loading = true;
      try {
        const { data } = await examsService.getActiveExams();
        this.activeExams = data.items || data;
      } finally {
        this.loading = false;
      }
    },

    async endExam(id) {
      await examsService.endExam(id);
      await this.fetchActiveExams();
    },

    async authenticateStudent(id, payload) {
      return await examsService.authenticateStudent(id, payload);
    },

    async fetchLogs(params = {}) {
      this.loading = true;
      const { toastError } = useAlert();
      try {
        const { data } = await examsService.getExamLogs(params);
        this.logs = data.items || data;
      } catch (err) {
        toastError("Error", "Failed to fetch exam logs.");
      } finally {
        this.loading = false;
      }
    },
  },
});