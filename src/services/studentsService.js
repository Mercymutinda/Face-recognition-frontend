// src/services/studentService.js
import api from "@/utils/api";

export const studentService = {
  getStudents: (params) => api.get("/students", { params }),

  registerStudent: (data) => api.post("/students", data),

  updateStudent: (studentId, data) => api.patch(`/students/${studentId}`, data),

  deleteStudent: (studentId) => api.delete(`/students/${studentId}`),

  uploadStudentFace: (studentId, data) =>
    api.post(`/students/${studentId}/face/upload`, data),
};
