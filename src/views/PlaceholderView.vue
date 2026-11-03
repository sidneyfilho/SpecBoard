<script setup lang="ts">
defineProps<{ title: string; text: string }>()
</script>

<template>
  <div class="sb-panel pa-8 text-center">
    <v-icon icon="mdi-timer-sand" size="40" class="mb-2" />
    <h2 class="text-h5 mb-2">{{ title }}</h2>
    <p class="text-medium-emphasis">{{ text }}</p>
  </div>
</template>
