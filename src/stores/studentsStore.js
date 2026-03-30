// src/stores/studentsStore.js
import { defineStore } from "pinia";
import { studentsService } from "@/services/studentsService";

export const useStudentsStore = defineStore("students", {
  state: () => ({
    students: [],
    meta: { page: 1, limit: 10, total: 0 },
    loading: false,
  }),

  actions: {
    async fetchStudents(params = {}) {
      this.loading = true;
      try {
        const { data } = await studentsService.getStudents(params);
        this.students = data.items || data;
        this.meta = data.meta || this.meta;
      } finally {
        this.loading = false;
      }
    },

    async createStudent(payload) {
      await studentsService.createStudent(payload);
      await this.fetchStudents();
    },

    async updateStudent(id, payload) {
      await studentsService.updateStudent(id, payload);
      await this.fetchStudents();
    },

    async deleteStudent(id) {
      await studentsService.deleteStudent(id);
      await this.fetchStudents();
    },
  },
});