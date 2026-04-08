// src/services/examsService.js
import api from "@/utils/api";

export const examsService = {
  createExam: (data) => api.post("/exams", data),

  getActiveExams: (params) => api.get("/exams/active", { params }),

  endExam: (examId) => api.patch(`/exams/${examId}/end`),

  authenticateStudent: (examId, data) => api.post(`/exams/${examId}/auth`, data),

  getExamLogs: (params) => api.get("/exams/logs", { params }),
};