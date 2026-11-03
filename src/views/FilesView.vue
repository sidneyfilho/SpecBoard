<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'

const project = useProjectStore()
const files = computed(() => Object.keys(project.model.files).sort())
const errors = computed(() => project.model.issues.filter((i) => i.severity === 'error'))
const warnings = computed(() => project.model.issues.filter((i) => i.severity === 'warning'))
</script>

<template>
  <h2 class="text-h5 mb-3">Arquivos</h2>
  <v-row>
    <v-col cols="12" md="6">
      <div class="sb-panel pa-4">
        <div class="text-subtitle-2 mb-2">Documentos do projeto ({{ files.length }})</div>
        <div v-for="f in files" :key="f" class="sb-mono py-1 d-flex align-center ga-2">
          <v-icon :icon="f.endsWith('.md') ? 'mdi-language-markdown-outline' : 'mdi-code-json'" size="16" />
          <span>{{ f }}</span>
          <v-chip v-if="project.externalChanges.includes(f)" color="warning" variant="tonal">alterado externamente</v-chip>
          <v-chip v-else-if="project.git.changed?.some((c) => c.endsWith(f))" color="info" variant="tonal">modificado (git)</v-chip>
        </div>
      </div>
    </v-col>
    <v-col cols="12" md="6">
      <div class="sb-panel pa-4">
        <div class="text-subtitle-2 mb-2">Validação</div>
        <div v-if="!project.model.issues.length" class="text-success text-body-2"><v-icon icon="mdi-check-circle" size="16" /> Todos os arquivos foram interpretados sem problemas.</div>
        <v-alert v-for="(i, k) in errors" :key="'e' + k" type="error" variant="tonal" density="compact" class="mb-1">
          {{ i.message }}<div v-if="i.file" class="sb-mono text-caption">{{ i.file }}{{ i.line ? `:${i.line}` : '' }}</div>
        </v-alert>
        <v-alert v-for="(i, k) in warnings" :key="'w' + k" type="warning" variant="tonal" density="compact" class="mb-1">
          {{ i.message }}<div v-if="i.file" class="sb-mono text-caption">{{ i.file }}{{ i.line ? `:${i.line}` : '' }}</div>
        </v-alert>
      </div>
    </v-col>
  </v-row>
</template>
