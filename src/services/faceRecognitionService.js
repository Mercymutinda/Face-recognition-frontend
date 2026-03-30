// src/services/faceService.js
import api from "@/utils/api";

export const faceService = {
  uploadFace: (data) => api.post("/face/upload", data),

  liveScan: (data) => api.post("/face/live-scan", data),

  registerFace: (data) => api.post("/face/register", data),

  recognizeFace: (data) => api.post("/face/recognize", data),
};
