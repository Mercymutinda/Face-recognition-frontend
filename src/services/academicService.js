// src/services/academicService.js
import api from '@/utils/api';

export const academicService = {
  // PROGRAMS
  getPrograms: (params) => api.get('/academic/programs', { params }),
  createProgram: (data) => api.post('/academic/programs', data),
  updateProgram: (id, data) => api.patch(`/academic/programs/${id}`, data),
  deleteProgram: (id) => api.delete(`/academic/programs/${id}`),

  // COHORTS (CLASSES)
  getCohorts: (params) => api.get('/academic/cohorts', { params }),
  createCohort: (data) => api.post('/academic/cohorts', data),
  updateCohort: (id, data) => api.patch(`/academic/cohorts/${id}`, data),
  deleteCohort: (id) => api.delete(`/academic/cohorts/${id}`),

  // UNITS
  getUnits: (params) => api.get('/academic/units', { params }),
  createUnit: (data) => api.post('/academic/units', data),
  updateUnit: (id, data) => api.patch(`/academic/units/${id}`, data),
  deleteUnit: (id) => api.delete(`/academic/units/${id}`),

  // HALLS
  getHalls: (params) => api.get('/academic/halls', { params }),
  createHall: (data) => api.post('/academic/halls', data),
  updateHall: (id, data) => api.patch(`/academic/halls/${id}`, data),
  deleteHall: (id) => api.delete(`/academic/halls/${id}`),

  // TIMETABLE
  getTimetable: (params) => api.get('/academic/timetable', { params }),
  getStudentTimetable: (cohortId) =>
    api.get(`/academic/timetable/student/${cohortId}`),
  getLecturerTimetable: (lecturerId) =>
    api.get(`/academic/timetable/lecturer/${lecturerId}`),
  createTimetable: (data) => api.post('/academic/timetable', data),
  updateTimetable: (id, data) =>
    api.patch(`/academic/timetable/${id}`, data),
  deleteTimetable: (id) =>
    api.delete(`/academic/timetable/${id}`),

  // SESSIONS
  startSession: (data) => api.post('/academic/sessions', data),
  endSession: (sessionId) =>
    api.patch(`/academic/sessions/${sessionId}/end`)
};