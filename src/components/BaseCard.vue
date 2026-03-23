<template>
    <div class="card card-custom shadow-sm border-0 rounded-3 overflow-hidden">
      <div v-if="$slots.header" class="card-header bg-white border-bottom py-3">
        <slot name="header" />
      </div>
      <div class="card-body p-4">
        <slot />
      </div>
    </div>
  </template>