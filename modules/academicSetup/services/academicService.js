import api from '@/utils/api';

export const academicService = {
  getPrograms: () => api.get('/academic/programs'),
  createHall: (data) => api.post('/academic/halls', data),
  updateProgram: (id, data) => api.patch(`/academic/programs/${id}`, data),
};