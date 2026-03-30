// src/stores/faceRecognitionStore.js
import { defineStore } from "pinia";
import { faceRecognitionService } from "@/services/faceRecognitionService";

export const useFaceRecognitionStore = defineStore("faceRecognition", {
  state: () => ({
    loading: false,
    result: null,
  }),

  actions: {
    async uploadFace(payload) {
      return await faceRecognitionService.upload(payload);
    },

    async liveScan(payload) {
      return await faceRecognitionService.liveScan(payload);
    },

    async registerFace(payload) {
      return await faceRecognitionService.register(payload);
    },

    async recognizeFace(payload) {
      this.loading = true;
      try {
        const { data } = await faceRecognitionService.recognize(payload);
        this.result = data;
        return data;
      } finally {
        this.loading = false;
      }
    },
  },
});