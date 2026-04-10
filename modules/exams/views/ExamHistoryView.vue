<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/utils/api";

const records = ref([]);
const loading = ref(true);

onMounted(async () => {
  try { const { data } = await api.get("/exams/my-history"); records.value = data ?? []; }
  finally { loading.value = false; }
});

const summary = computed(() => ({
  total:    records.value.length,
  verified: records.value.filter((r) => r.status === "verified").length,
  rejected: records.value.filter((r) => r.status === "rejected").length,
  spoof:    records.value.filter((r) => r.status === "spoof").length,
}));

const pct  = (v) => v != null ? (v * 100).toFixed(1) + "%" : "—";
const fmt  = (dt) => dt ? new Date(dt).toLocaleString("en-GB", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

const statusBadge = (s) => ({
  verified: "bg-success",
  rejected: "bg-danger",
  spoof:    "bg-warning text-dark",
}[s] || "bg-secondary");

const statusIcon = (s) => ({ verified:"✅", rejected:"❌", spoof:"⚠️" }[s] || "—");
</script>

<template>
  <BasePageHeading title="My Exam History" subtitle="Your biometric authentication records during exams"/>

  <div class="content">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border" style="color:#E65F0E;"></div></div>

    <template v-else>
      <!-- Summary cards -->
      <div class="row g-3 mb-4">
        <div v-for="card in [
          { label:'Total Exams',  val: summary.total,    color:'#331B11' },
          { label:'Verified',     val: summary.verified, color:'#415A20' },
          { label:'Rejected',     val: summary.rejected, color:'#c0392b' },
          { label:'Flagged',      val: summary.spoof,    color:'#E65F0E' },
        ]" :key="card.label" class="col-6 col-md-3">
          <BaseBlock class="mb-0 text-center py-3">
            <div style="font-size:28px;font-weight:700;" :style="{ color: card.color }">{{ card.val }}</div>
            <div class="text-muted" style="font-size:12px;">{{ card.label }}</div>
          </BaseBlock>
        </div>
      </div>

      <!-- Verification rate bar -->
      <BaseBlock class="mb-4" v-if="summary.total">
        <div class="d-flex justify-content-between mb-1" style="font-size:12.5px;">
          <span class="fw-semibold">Verification Success Rate</span>
          <span style="color:#415A20;">
            {{ summary.total ? Math.round((summary.verified/summary.total)*100) : 0 }}%
          </span>
        </div>
        <div class="progress" style="height:8px;border-radius:4px;">
          <div class="progress-bar" style="background:#415A20;"
            :style="{ width: summary.total ? (summary.verified/summary.total*100)+'%' : '0%' }"></div>
          <div class="progress-bar" style="background:#c0392b;"
            :style="{ width: summary.total ? (summary.rejected/summary.total*100)+'%' : '0%' }"></div>
          <div class="progress-bar" style="background:#E65F0E;"
            :style="{ width: summary.total ? (summary.spoof/summary.total*100)+'%' : '0%' }"></div>
        </div>
        <div class="d-flex gap-3 mt-2" style="font-size:11px;color:#7a5c42;">
          <span>🟢 Verified</span><span>🔴 Rejected</span><span>🟠 Flagged</span>
        </div>
      </BaseBlock>

      <!-- Timeline cards -->
      <div class="row g-3">
        <div v-for="r in records" :key="r.id" class="col-md-6 col-lg-4">
          <div class="rounded-3 p-3 h-100"
            style="border:1.5px solid;"
            :style="{
              borderColor: r.status==='verified'?'rgba(65,90,32,.25)': r.status==='spoof'?'rgba(230,95,14,.25)':'rgba(192,57,43,.25)',
              background:  r.status==='verified'?'rgba(65,90,32,.04)': r.status==='spoof'?'rgba(230,95,14,.04)':'rgba(192,57,43,.04)',
            }">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div class="fw-semibold" style="font-size:13px;">
                  {{ statusIcon(r.status) }} Unit #{{ r.unit_id }}
                </div>
                <div class="text-muted" style="font-size:11px;">{{ fmt(r.verified_at) }}</div>
              </div>
              <span :class="['badge', statusBadge(r.status)]" style="font-size:11px;">{{ r.status }}</span>
            </div>

            <!-- Score bars -->
            <div class="mt-2" style="font-size:11px;">
              <div class="d-flex justify-content-between mb-1">
                <span style="color:#7a5c42;">Liveness</span>
                <span style="font-family:'DM Mono',monospace;">{{ pct(r.liveness_score) }}</span>
              </div>
              <div style="height:4px;border-radius:2px;background:rgba(0,0,0,.08);margin-bottom:6px;">
                <div style="height:100%;border-radius:2px;background:#415A20;transition:.3s;"
                  :style="{ width: r.liveness_score ? (r.liveness_score*100)+'%' : '0%' }"></div>
              </div>

              <div class="d-flex justify-content-between mb-1">
                <span style="color:#7a5c42;">Face Match</span>
                <span style="font-family:'DM Mono',monospace;">{{ pct(r.match_score) }}</span>
              </div>
              <div style="height:4px;border-radius:2px;background:rgba(0,0,0,.08);">
                <div style="height:100%;border-radius:2px;background:#E65F0E;transition:.3s;"
                  :style="{ width: r.match_score ? (r.match_score*100)+'%' : '0%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!records.length" class="col-12 text-center py-5 text-muted">
          <i class="si si-badge" style="font-size:36px;opacity:.25;"></i>
          <p class="mt-2 mb-0" style="font-size:13px;">No exam authentication records yet.</p>
        </div>
      </div>
    </template>
  </div>
</template>