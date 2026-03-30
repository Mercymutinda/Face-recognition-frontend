// src/stores/academicStore.js
import { defineStore } from "pinia";
import { academicService } from "@/services/academicService";

// ── Default pagination state ────────────────────────────────────────────────
const defaultMeta = () => ({ page: 1, limit: 10, total: 0 });

// ── Helper: unwrap backend responses ────────────────────────────────────────
function unwrapList(data) {
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: { page: 1, limit: data.length, total: data.length },
    };
  }
  return {
    items: data?.items ?? [],
    meta: data?.meta ?? defaultMeta(),
  };
}

export const useAcademicSetupStore = defineStore("academicSetup", {
  // ── STATE ────────────────────────────────────────────────────────────────
  state: () => ({
    programs: [],
    cohorts: [],
    units: [],
    halls: [],
    timetable: [],

    meta: {
      programs: defaultMeta(),
      cohorts: defaultMeta(),
      units: defaultMeta(),
      halls: defaultMeta(),
      timetable: defaultMeta(),
    },

    loading: {
      programs: false,
      cohorts: false,
      units: false,
      halls: false,
      timetable: false,
    },

    error: null,
  }),

  // ── GETTERS ──────────────────────────────────────────────────────────────
  getters: {
    classes: (state) => state.cohorts,
  },

  // ── ACTIONS ──────────────────────────────────────────────────────────────
  actions: {
    // ───────── PROGRAMS ─────────
    async fetchPrograms(params = {}) {
      this.loading.programs = true;
      this.error = null;
      try {
        const { data } = await academicService.getPrograms(params);
        const { items, meta } = unwrapList(data);

        this.programs = items;
        this.meta.programs = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.programs = false;
      }
    },

    async createProgram(payload) {
      await academicService.createProgram(payload);
      await this.fetchPrograms({
        page: this.meta.programs.page,
        limit: this.meta.programs.limit,
      });
    },

    async updateProgram(id, payload) {
      await academicService.updateProgram(id, payload);
      await this.fetchPrograms({
        page: this.meta.programs.page,
        limit: this.meta.programs.limit,
      });
    },

    async deleteProgram(id) {
      await academicService.deleteProgram(id);
      await this.fetchPrograms({
        page: this.meta.programs.page,
        limit: this.meta.programs.limit,
      });
    },

    // ───────── COHORTS ─────────
    async fetchClasses(params = {}) {
      this.loading.cohorts = true;
      this.error = null;
      try {
        const { data } = await academicService.getCohorts(params);
        const { items, meta } = unwrapList(data);

        this.cohorts = items;
        this.meta.cohorts = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.cohorts = false;
      }
    },

    async createClass(payload) {
      await academicService.createCohort(payload);
      await this.fetchClasses({
        page: this.meta.cohorts.page,
        limit: this.meta.cohorts.limit,
      });
    },

    async updateClass(id, payload) {
      await academicService.updateCohort(id, payload);
      await this.fetchClasses({
        page: this.meta.cohorts.page,
        limit: this.meta.cohorts.limit,
      });
    },

    async deleteClass(id) {
      await academicService.deleteCohort(id);
      await this.fetchClasses({
        page: this.meta.cohorts.page,
        limit: this.meta.cohorts.limit,
      });
    },

    // ───────── UNITS ─────────
    async fetchUnits(params = {}) {
      this.loading.units = true;
      this.error = null;
      try {
        const { data } = await academicService.getUnits(params);
        const { items, meta } = unwrapList(data);

        this.units = items;
        this.meta.units = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.units = false;
      }
    },

    async createUnit(payload) {
      await academicService.createUnit(payload);
      await this.fetchUnits({
        page: this.meta.units.page,
        limit: this.meta.units.limit,
      });
    },

    async updateUnit(id, payload) {
      await academicService.updateUnit(id, payload);
      await this.fetchUnits({
        page: this.meta.units.page,
        limit: this.meta.units.limit,
      });
    },

    async deleteUnit(id) {
      await academicService.deleteUnit(id);
      await this.fetchUnits({
        page: this.meta.units.page,
        limit: this.meta.units.limit,
      });
    },

    // ───────── HALLS ─────────
    async fetchHalls(params = {}) {
      this.loading.halls = true;
      this.error = null;
      try {
        const { data } = await academicService.getHalls(params);
        const { items, meta } = unwrapList(data);

        this.halls = items;
        this.meta.halls = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.halls = false;
      }
    },

    async createHall(payload) {
      await academicService.createHall(payload);
      await this.fetchHalls({
        page: this.meta.halls.page,
        limit: this.meta.halls.limit,
      });
    },

    async updateHall(id, payload) {
      await academicService.updateHall(id, payload);
      await this.fetchHalls({
        page: this.meta.halls.page,
        limit: this.meta.halls.limit,
      });
    },

    async deleteHall(id) {
      await academicService.deleteHall(id);
      await this.fetchHalls({
        page: this.meta.halls.page,
        limit: this.meta.halls.limit,
      });
    },

    // ───────── TIMETABLE ─────────
    async fetchTimetable(params = {}) {
      this.loading.timetable = true;
      this.error = null;
      try {
        const { data } = await academicService.getTimetable(params);
        const { items, meta } = unwrapList(data);

        this.timetable = items;
        this.meta.timetable = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.timetable = false;
      }
    },

    async createTimetableEntry(payload) {
      await academicService.createTimetable(payload);
      await this.fetchTimetable({
        page: this.meta.timetable.page,
        limit: this.meta.timetable.limit,
      });
    },

    async updateTimetableEntry(id, payload) {
      await academicService.updateTimetable(id, payload);
      await this.fetchTimetable({
        page: this.meta.timetable.page,
        limit: this.meta.timetable.limit,
      });
    },

    async deleteTimetableEntry(id) {
      await academicService.deleteTimetable(id);
      await this.fetchTimetable({
        page: this.meta.timetable.page,
        limit: this.meta.timetable.limit,
      });
    },

    // ───────── SESSIONS ─────────
    async startSession(payload) {
      const { data } = await academicService.startSession(payload);
      return data;
    },

    async endSession(sessionId) {
      await academicService.endSession(sessionId);
    },

    // ───────── PAGINATION ─────────
    async changePage(resource, page) {
      const map = {
        programs: () =>
          this.fetchPrograms({ page, limit: this.meta.programs.limit }),

        cohorts: () =>
          this.fetchClasses({ page, limit: this.meta.cohorts.limit }),

        units: () =>
          this.fetchUnits({ page, limit: this.meta.units.limit }),

        halls: () =>
          this.fetchHalls({ page, limit: this.meta.halls.limit }),

        timetable: () =>
          this.fetchTimetable({ page, limit: this.meta.timetable.limit }),
      };

      if (map[resource]) {
        await map[resource]();
      }
    },
  },
});

// ── ERROR HELPER ────────────────────────────────────────────────────────────
function _errMsg(err) {
  return (
    err?.response?.data?.detail ??
    err?.message ??
    "An unexpected error occurred."
  );
}