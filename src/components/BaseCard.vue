<template>
  <div class="card card-custom shadow-sm border-0 rounded-3 overflow-hidden h-100">
    <div v-if="$slots.header" class="card-header bg-white border-bottom py-3">
      <slot name="header" />
    </div>
    <div class="card-body p-4">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer bg-light border-top py-2">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.card-custom { transition: transform 0.2s; }
.card-custom:hover { transform: translateY(-3px); }
</style>