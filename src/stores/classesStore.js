// src/stores/classesStore.js
import { defineStore } from "pinia";
import { classesService } from "@/services/classesService";

export const useclassesStore = defineStore("classes", {
  state: () => ({
    classes: [],
    meta: { page: 1, limit: 10, total: 0 },
    loading: false,
  }),

  actions: {
    async fetchclasses(params = {}) {
      this.loading = true;
      try {
        const { data } = await classesService.getclasses(params);
        this.classes = data.items || data;
        this.meta = data.meta || this.meta;
      } finally {
        this.loading = false;
      }
    },

    async createStudent(payload) {
      await classesService.createStudent(payload);
      await this.fetchclasses();
    },

    async updateStudent(id, payload) {
      await classesService.updateStudent(id, payload);
      await this.fetchclasses();
    },

    async deleteStudent(id) {
      await classesService.deleteStudent(id);
      await this.fetchclasses();
    },
  },
});