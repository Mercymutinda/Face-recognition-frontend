// modules/academicSetup/store/academicSetupStore.js
import { defineStore } from "pinia";
import api from "@/utils/api";

export const useAcademicSetupStore = defineStore("academicSetup", {
  state: () => ({
    programs: [],
    classes:  [],
    units:    [],
    halls:    [],
    timetable:[],
    loading:  false,
    error:    null,
  }),

  actions: {
    // ── Programs ────────────────────────────────────────────────────
    async fetchPrograms() {
      this.loading = true;
      try { const { data } = await api.get("/academic/programs"); this.programs = data; }
      catch (e) { this.error = e.response?.data?.detail; }
      finally { this.loading = false; }
    },
    async createProgram(payload) {
      const { data } = await api.post("/academic/programs", payload);
      this.programs.push(data);
      return data;
    },
    async updateProgram(id, payload) {
      const { data } = await api.patch(`/academic/programs/${id}`, payload);
      const i = this.programs.findIndex((p) => p.id === id);
      if (i > -1) this.programs[i] = data;
      return data;
    },
    async deleteProgram(id) {
      await api.delete(`/academic/programs/${id}`);
      this.programs = this.programs.filter((p) => p.id !== id);
    },

    // ── Classes ─────────────────────────────────────────────────────
    async fetchClasses(programId = null) {
      this.loading = true;
      try {
        const params = programId ? { program_id: programId } : {};
        const { data } = await api.get("/academic/classes", { params });
        this.classes = data;
      } catch (e) { this.error = e.response?.data?.detail; }
      finally { this.loading = false; }
    },
    async createClass(payload) {
      const { data } = await api.post("/academic/classes", payload);
      this.classes.push(data);
      return data;
    },
    async updateClass(id, payload) {
      const { data } = await api.patch(`/academic/classes/${id}`, payload);
      const i = this.classes.findIndex((c) => c.id === id);
      if (i > -1) this.classes[i] = data;
      return data;
    },

    // ── Units ────────────────────────────────────────────────────────
    async fetchUnits(programId = null) {
      this.loading = true;
      try {
        const params = programId ? { program_id: programId } : {};
        const { data } = await api.get("/academic/units", { params });
        this.units = data;
      } catch (e) { this.error = e.response?.data?.detail; }
      finally { this.loading = false; }
    },
    async createUnit(payload) {
      const { data } = await api.post("/academic/units", payload);
      this.units.push(data);
      return data;
    },
    async updateUnit(id, payload) {
      const { data } = await api.patch(`/academic/units/${id}`, payload);
      const i = this.units.findIndex((u) => u.id === id);
      if (i > -1) this.units[i] = data;
      return data;
    },

    // ── Halls ────────────────────────────────────────────────────────
    async fetchHalls() {
      this.loading = true;
      try { const { data } = await api.get("/academic/halls"); this.halls = data; }
      catch (e) { this.error = e.response?.data?.detail; }
      finally { this.loading = false; }
    },
    async createHall(payload) {
      const { data } = await api.post("/academic/halls", payload);
      this.halls.push(data);
      return data;
    },
    async updateHall(id, payload) {
      const { data } = await api.patch(`/academic/halls/${id}`, payload);
      const i = this.halls.findIndex((h) => h.id === id);
      if (i > -1) this.halls[i] = data;
      return data;
    },

    // ── Timetable ────────────────────────────────────────────────────
    async fetchTimetable(params = {}) {
      this.loading = true;
      try { const { data } = await api.get("/academic/timetable", { params }); this.timetable = data; }
      catch (e) { this.error = e.response?.data?.detail; }
      finally { this.loading = false; }
    },
    async fetchTodaysTimetable(params = {}) {
      const { data } = await api.get("/academic/timetable/today", { params });
      return data;
    },
    async createTimetableEntry(payload) {
      const { data } = await api.post("/academic/timetable", payload);
      this.timetable.push(data);
      return data;
    },
  },
});