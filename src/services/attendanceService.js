import api from '@/utils/api';

export const attendanceService = {
  
  getPrograms: (params) => api.post('/attendance/scan', { params }),
  createProgram: (data) => api.get('/attendance/history', data),
  updateProgram: (id, data) => api.get(`/attendance/user/${id}`, data),
};