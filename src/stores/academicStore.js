// src/stores/academicStore.js
import { defineStore } from 'pinia';
import { academicService } from '@/services/academicService';

export const useAcademicStore = defineStore('academic', {
  state: () => ({
    programs: [],
    cohorts: [],
    units: [],
    halls: [],
    timetable: [],

    loading: false,
    error: null,

    pagination: {
      page: 1,
      limit: 10,
      total: 0
    }
  }),

  actions: {
    async fetchPrograms(params = {}) {
      this.loading = true;
      try {
        const res = await academicService.getPrograms(params);

        this.programs = res.data.items || res.data;
        this.pagination = res.data.meta || this.pagination;

      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    async createProgram(data) {
      await academicService.createProgram(data);
      await this.fetchPrograms();
    },

    async updateProgram(id, data) {
      await academicService.updateProgram(id, data);
      await this.fetchPrograms();
    },

    async deleteProgram(id) {
      await academicService.deleteProgram(id);
      await this.fetchPrograms();
    },

    // SAME PATTERN FOR COHORTS, UNITS, HALLS

    async fetchCohorts(params = {}) {
      const res = await academicService.getCohorts(params);
      this.cohorts = res.data.items || res.data;
    },

    async fetchUnits(params = {}) {
      const res = await academicService.getUnits(params);
      this.units = res.data.items || res.data;
    },

    async fetchHalls(params = {}) {
      const res = await academicService.getHalls(params);
      this.halls = res.data.items || res.data;
    },

    async fetchTimetable(params = {}) {
      const res = await academicService.getTimetable(params);
      this.timetable = res.data.items || res.data;
    }
  }
});