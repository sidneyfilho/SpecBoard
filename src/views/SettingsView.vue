<script setup lang="ts">
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
const p = project.model.project
</script>

<template>
  <h2 class="text-h5 mb-3">Configurações</h2>
  <div class="sb-panel pa-4 mb-3">
    <div class="text-subtitle-2 mb-2">Projeto (.specboard/project.yaml)</div>
    <v-table density="compact" class="bg-transparent">
      <tbody>
        <tr><td>Nome</td><td>{{ project.model.project.name }}</td></tr>
        <tr><td>ID</td><td>{{ project.model.project.id }}</td></tr>
        <tr><td>Raiz</td><td class="sb-mono">{{ project.model.project.repositoryRoot }}</td></tr>
        <tr><td>Diretório de Specs</td><td class="sb-mono">{{ project.model.project.specsDirectory }}</td></tr>
        <tr><td>Constituição</td><td class="sb-mono">{{ p.constitutionPath ?? '—' }}</td></tr>
        <tr><td>Instruções de agentes</td><td class="sb-mono">{{ p.agentInstructionsPath ?? '—' }}</td></tr>
      </tbody>
    </v-table>
  </div>
  <div class="sb-panel pa-4">
    <div class="text-subtitle-2 mb-2">Preferências de interface</div>
    <v-switch :model-value="ui.theme === 'dark'" label="Tema escuro" color="primary" hide-details @update:model-value="ui.theme = $event ? 'dark' : 'light'" />
    <v-btn class="mt-3" variant="tonal" prepend-icon="mdi-folder-open-outline" @click="ui.openDialog = true">Abrir outro repositório</v-btn>
  </div>
</template>
