// src/stores/academicStore.js
// ─────────────────────────────────────────────────────────────────────────────
// Centralized store for all academic data.
// Pagination shape matches the FastAPI backend:
//   { items: [...], meta: { page, limit, total } }
// ─────────────────────────────────────────────────────────────────────────────

import { defineStore } from "pinia";
import api from "@/utils/api";
import { academicService } from "@/services/academicService";
// ── Default pagination state factory ─────────────────────────────────────────
const defaultMeta = () => ({ page: 1, limit: 10, total: 0 });

// ── Helper: unwrap backend list responses ────────────────────────────────────
// Backend may return { items, meta } OR a plain array depending on the endpoint.
function unwrapList(data) {
  if (Array.isArray(data)) {
    return { items: data, meta: { page: 1, limit: data.length, total: data.length } };
  }
  return {
    items: data?.items ?? [],
    meta:  data?.meta  ?? defaultMeta(),
  };
}

export const useAcademicSetupStore = defineStore("academicSetup", {
  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    programs:  [],
    cohorts:   [],   // called "classes" in the UI
    units:     [],
    halls:     [],
    timetable: [],

    // Per-resource pagination metadata
    meta: {
      programs:  defaultMeta(),
      cohorts:   defaultMeta(),
      units:     defaultMeta(),
      halls:     defaultMeta(),
      timetable: defaultMeta(),
    },

    loading: {
      programs: false,
      cohorts: false,
      units: false,
      halls: false,
      timetable: false,
    },
    error:   null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** Alias so old template code using store.classes still works */
    classes: (state) => state.cohorts,
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    // ── PROGRAMS ────────────────────────────────────────────────────────────

    async fetchPrograms(params = {}) {
      this.loading.programs = true;
      this.error   = null;
      try {
        const { data } = await academicService.getPrograms(params);
        const { items, meta } = unwrapList(data);
        this.programs      = items;
        this.meta.programs = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.programs = false;
      }
    },

    async createProgram(payload) {
      const { data } = await academicService.createProgram(payload);
      await this.fetchPrograms();
      return data;
    },

    async updateProgram(id, payload) {
      const { data } = await api.patch(`/academic/programs/${id}`, payload);
      this.programs = this.programs.map((p) => (p.id === id ? data : p));
      return data;
    },

    async deleteProgram(id) {
      await api.delete(`/academic/programs/${id}`);
      this.programs = this.programs.filter((p) => p.id !== id);
    },

    // ── COHORTS (CLASSES) ────────────────────────────────────────────────────

    async fetchClasses(params = {}) {
      this.loading.cohorts = true;
      this.error   = null;
      try {
        const { data } = await api.get("/academic/cohorts", { params });
        const { items, meta } = unwrapList(data);
        this.cohorts      = items;
        this.meta.cohorts = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.cohorts = false;
      }
    },

    async createClass(payload) {
      const { data } = await api.post("/academic/cohorts", payload);
      this.cohorts.push(data);
      return data;
    },

    async updateClass(id, payload) {
      const { data } = await api.patch(`/academic/cohorts/${id}`, payload);
      this.cohorts = this.cohorts.map((c) => (c.id === id ? data : c));
      return data;
    },

    async deleteClass(id) {
      await api.delete(`/academic/cohorts/${id}`);
      this.cohorts = this.cohorts.filter((c) => c.id !== id);
    },

    // ── UNITS ────────────────────────────────────────────────────────────────

    async fetchUnits(params = {}) {
      this.loading.units = true;
      this.error   = null;
      try {
        const { data } = await api.get("/academic/units", { params });
        const { items, meta } = unwrapList(data);
        this.units      = items;
        this.meta.units = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.units = false;
      }
    },

    async createUnit(payload) {
      const { data } = await api.post("/academic/units", payload);
      this.units.push(data);
      return data;
    },

    async updateUnit(id, payload) {
      const { data } = await api.patch(`/academic/units/${id}`, payload);
      this.units = this.units.map((u) => (u.id === id ? data : u));
      return data;
    },

    async deleteUnit(id) {
      await api.delete(`/academic/units/${id}`);
      this.units = this.units.filter((u) => u.id !== id);
    },

    // ── HALLS ────────────────────────────────────────────────────────────────

    async fetchHalls(params = {}) {
      this.loading.halls = true;
      this.error   = null;
      try {
        const { data } = await api.get("/academic/halls", { params });
        const { items, meta } = unwrapList(data);
        this.halls      = items;
        this.meta.halls = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.halls = false;
      }
    },

    async createHall(payload) {
      const { data } = await api.post("/academic/halls", payload);
      this.halls.push(data);
      return data;
    },

    async updateHall(id, payload) {
      const { data } = await api.patch(`/academic/halls/${id}`, payload);
      this.halls = this.halls.map((h) => (h.id === id ? data : h));
      return data;
    },

    async deleteHall(id) {
      await api.delete(`/academic/halls/${id}`);
      this.halls = this.halls.filter((h) => h.id !== id);
    },

    // ── TIMETABLE ────────────────────────────────────────────────────────────

    async fetchTimetable(params = {}) {
      this.loading.timetable = true;
      this.error   = null;
      try {
        const { data } = await api.get("/academic/timetable", { params });
        const { items, meta } = unwrapList(data);
        this.timetable      = items;
        this.meta.timetable = meta;
      } catch (err) {
        this.error = _errMsg(err);
        throw err;
      } finally {
        this.loading.timetable = false;
      }
    },

    async createTimetableEntry(payload) {
      const { data } = await api.post("/academic/timetable", payload);
      this.timetable.push(data);
      return data;
    },

    async updateTimetableEntry(id, payload) {
      const { data } = await api.patch(`/academic/timetable/${id}`, payload);
      this.timetable = this.timetable.map((t) => (t.id === id ? data : t));
      return data;
    },

    async deleteTimetableEntry(id) {
      await api.delete(`/academic/timetable/${id}`);
      this.timetable = this.timetable.filter((t) => t.id !== id);
    },

    // ── SESSIONS ─────────────────────────────────────────────────────────────

    async startSession(payload) {
      const { data } = await api.post("/academic/sessions", payload);
      return data;
    },

    async endSession(sessionId) {
      await api.patch(`/academic/sessions/${sessionId}/end`);
    },

 
    async changePage(resource, page) {
      const methodMap = {
        programs:  () => this.fetchPrograms({ page, limit: this.meta.programs.limit }),
        cohorts:   () => this.fetchClasses({ page,  limit: this.meta.cohorts.limit }),
        units:     () => this.fetchUnits({ page,    limit: this.meta.units.limit }),
        halls:     () => this.fetchHalls({ page,    limit: this.meta.halls.limit }),
        timetable: () => this.fetchTimetable({ page, limit: this.meta.timetable.limit }),
      };
      const fn = methodMap[resource];
      if (fn) await fn();
    },
  },
});

// ── Internal helpers ──────────────────────────────────────────────────────────
function _errMsg(err) {
  return (
    err?.response?.data?.detail ??
    err?.message ??
    "An unexpected error occurred."
  );
}