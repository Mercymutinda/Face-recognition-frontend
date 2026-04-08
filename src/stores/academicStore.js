import { defineStore } from "pinia";
import { academicService } from "@/services/academicService";
import { useAlert } from "@/composables/alerts";

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
  state: () => ({
    programs: [],
    cohorts: [], // Used for Classes
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

  getters: {
    // Alias cohorts to classes for frontend consistency
    classes: (state) => state.cohorts,
  },

  actions: {
    // ───────── PROGRAMS ─────────
    // Schema: { code, name, description }
    async fetchPrograms(params = {}) {
      const { toastError } = useAlert();
      this.loading.programs = true;
      this.error = null;
      try {
        const { data } = await academicService.getPrograms(params);
        const { items, meta } = unwrapList(data);
        this.programs = items;
        this.meta.programs = meta;
      } catch (err) {
        this.error = _errMsg(err);
        toastError("Error", this.error);
      } finally {
        this.loading.programs = false;
      }
    },

    async createProgram(payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.createProgram(payload);
        toastSuccess("Success", "Program created successfully");
        await this.fetchPrograms({
          page: this.meta.programs.page,
          limit: this.meta.programs.limit,
        });
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    async updateProgram(id, payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.updateProgram(id, payload);
        toastSuccess("Success", "Program updated successfully");
        await this.fetchPrograms({
          page: this.meta.programs.page,
          limit: this.meta.programs.limit,
        });
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    async deleteProgram(id) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.deleteProgram(id);
        toastSuccess("Deleted", "Program removed");
        await this.fetchPrograms({
          page: this.meta.programs.page,
          limit: this.meta.programs.limit,
        });
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    // ───────── COHORTS (CLASSES) ─────────
    // Schema: { name, program_id, year_of_study }
    async fetchClasses(params = {}) {
      const { toastError } = useAlert();
      this.loading.cohorts = true;
      try {
        const { data } = await academicService.getCohorts(params);
        const { items, meta } = unwrapList(data);
        this.cohorts = items;
        this.meta.cohorts = meta;
      } catch (err) {
        toastError("Error", _errMsg(err));
      } finally {
        this.loading.cohorts = false;
      }
    },

    async createClass(payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.createCohort(payload);
        toastSuccess("Success", "Class created");
        await this.fetchClasses();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    async updateClass(id, payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.updateCohort(id, payload);
        toastSuccess("Success", "Class updated");
        await this.fetchClasses();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    async deleteClass(id) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.deleteCohort(id);
        toastSuccess("Deleted", "Class removed");
        await this.fetchClasses();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    // ───────── UNITS ─────────
    // Schema: { code, name, program_id, year_of_study }
    async fetchUnits(params = {}) {
      const { toastError } = useAlert();
      this.loading.units = true;
      try {
        const { data } = await academicService.getUnits(params);
        const { items, meta } = unwrapList(data);
        this.units = items;
        this.meta.units = meta;
      } catch (err) {
        toastError("Error", _errMsg(err));
      } finally {
        this.loading.units = false;
      }
    },

    async createUnit(payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.createUnit(payload);
        toastSuccess("Success", "Unit created");
        await this.fetchUnits();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    async updateUnit(id, payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.updateUnit(id, payload);
        toastSuccess("Success", "Unit updated");
        await this.fetchUnits();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    async deleteUnit(id) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.deleteUnit(id);
        toastSuccess("Deleted", "Unit removed");
        await this.fetchUnits();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    // ───────── HALLS ─────────
    // Schema: { name, building, capacity, has_camera }
    async fetchHalls(params = {}) {
      const { toastError } = useAlert();
      this.loading.halls = true;
      try {
        const { data } = await academicService.getHalls(params);
        const { items, meta } = unwrapList(data);
        this.halls = items;
        this.meta.halls = meta;
      } catch (err) {
        toastError("Error", _errMsg(err));
      } finally {
        this.loading.halls = false;
      }
    },

    async createHall(payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.createHall(payload);
        toastSuccess("Success", "Hall created");
        await this.fetchHalls();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    async updateHall(id, payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.updateHall(id, payload);
        toastSuccess("Success", "Hall updated");
        await this.fetchHalls();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    async deleteHall(id) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.deleteHall(id);
        toastSuccess("Deleted", "Hall removed");
        await this.fetchHalls();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    // ───────── TIMETABLE ─────────
    // Schema: { unit_id, cohort_id, hall_id, lecturer_id, day_of_week, start_time, end_time }
    async fetchTimetable(params = {}) {
      const { toastError } = useAlert();
      this.loading.timetable = true;
      try {
        const { data } = await academicService.getTimetable(params);
        const { items, meta } = unwrapList(data);
        this.timetable = items;
        this.meta.timetable = meta;
      } catch (err) {
        toastError("Error", _errMsg(err));
      } finally {
        this.loading.timetable = false;
      }
    },

    async createTimetableEntry(payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.createTimetable(payload);
        toastSuccess("Success", "Entry added to timetable");
        await this.fetchTimetable();
      } catch (err) {
        toastError("Error", _errMsg(err));
        throw err;
      }
    },

    async updateTimetableEntry(id, payload) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.updateTimetable(id, payload);
        toastSuccess("Success", "Timetable updated");
        await this.fetchTimetable();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    async deleteTimetableEntry(id) {
      const { toastSuccess, toastError } = useAlert();
      try {
        await academicService.deleteTimetable(id);
        toastSuccess("Deleted", "Entry removed");
        await this.fetchTimetable();
      } catch (err) {
        toastError("Error", _errMsg(err));
      }
    },

    // ───────── PAGINATION ─────────
    async changePage(resource, page) {
      const map = {
        programs: () =>
          this.fetchPrograms({ page, limit: this.meta.programs.limit }),
        cohorts: () =>
          this.fetchClasses({ page, limit: this.meta.cohorts.limit }),
        units: () => this.fetchUnits({ page, limit: this.meta.units.limit }),
        halls: () => this.fetchHalls({ page, limit: this.meta.halls.limit }),
        timetable: () =>
          this.fetchTimetable({ page, limit: this.meta.timetable.limit }),
      };
      if (map[resource]) await map[resource]();
    },
  },
});

function _errMsg(err) {
  return (
    err?.response?.data?.detail ??
    err?.message ??
    "An unexpected error occurred."
  );
}
