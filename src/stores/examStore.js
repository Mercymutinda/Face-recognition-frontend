// src/stores/examsStore.js
import { defineStore } from "pinia";
import { examsService } from "@/services/examsService";

export const useExamsStore = defineStore("exams", {
  state: () => ({
    activeExams: [],
    logs: [],
  }),

  actions: {
    async createExam(payload) {
      return await examsService.createExam(payload);
    },

    async fetchActiveExams() {
      const { data } = await examsService.getActiveExams();
      this.activeExams = data;
    },

    async endExam(id) {
      await examsService.endExam(id);
      await this.fetchActiveExams();
    },

    async authenticateStudent(id, payload) {
      return await examsService.authenticateStudent(id, payload);
    },

    async fetchLogs() {
      const { data } = await examsService.getLogs();
      this.logs = data;
    },
  },
});