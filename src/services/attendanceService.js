import api from "@/utils/api";

export const attendanceService = {
  scanFaces: (data) => api.post("/attendance/scan", data),
  getHistory: (params) => api.get("/attendance/history", { params }),
  getUserAttendance: (userId, params) => api.get(`/attendance/user/${userId}`, { params }),
  

};