<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
const router = useRouter()
const { mdAndDown } = useDisplay()

const query = computed({
  get: () => ui.filters.query,
  set: (v: string) => {
    ui.filters.query = v ?? ''
  },
})

function onSearch() {
  if (!['/tasks', '/kanban', '/'].includes(router.currentRoute.value.path)) void router.push('/tasks')
}
</script>

<template>
  <v-app-bar flat color="background" border="b" height="64">
    <v-app-bar-nav-icon v-if="mdAndDown" aria-label="Abrir menu" @click="ui.drawer = !ui.drawer" />
    <v-app-bar-title class="flex-grow-0 mr-4">
      <div class="d-flex align-center ga-3">
        <v-avatar size="36" rounded="lg" color="surface-variant" class="border cursor-pointer" @click="ui.mediaDialog = true">
          <v-img v-if="ui.currentLogo" :src="ui.currentLogo" cover />
          <v-icon v-else icon="mdi-view-dashboard-variant" size="20" color="primary" />
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2">
            <span class="text-h6 font-weight-bold">{{ project.model.project.name }}</span>
            <v-chip v-if="project.isDemo" color="info" variant="tonal">demo</v-chip>
          </div>
          <div v-if="!mdAndDown" class="text-caption text-medium-emphasis text-truncate" style="max-width: 360px">
            {{ project.model.project.description }}
          </div>
        </div>
      </div>
    </v-app-bar-title>
    <v-spacer />
    <v-text-field
      v-model="query"
      class="mx-2"
      style="max-width: 420px; min-width: 160px"
      prepend-inner-icon="mdi-magnify"
      placeholder="Buscar specs, tarefas, arquivos…"
      clearable
      aria-label="Buscar"
      @update:model-value="onSearch"
    />
    <v-btn icon variant="text" aria-label="Alternar tema" @click="ui.theme = ui.theme === 'dark' ? 'light' : 'dark'">
      <v-icon :icon="ui.theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'" />
    </v-btn>
    <v-menu>
      <template #activator="{ props }">
        <v-btn icon variant="text" v-bind="props" aria-label="Menu do projeto"><v-icon icon="mdi-dots-vertical" /></v-btn>
      </template>
      <v-list density="compact">
        <v-list-item prepend-icon="mdi-swap-horizontal" title="Trocar ou abrir projeto…" @click="ui.openDialog = true" />
        <v-list-item prepend-icon="mdi-image-edit-outline" title="Alterar logo e capa…" @click="ui.mediaDialog = true" />
        <v-list-item prepend-icon="mdi-refresh" title="Recarregar do disco" :disabled="project.isDemo" @click="project.reload()" />
        <v-list-item prepend-icon="mdi-flask-outline" title="Ver dados de demonstração" @click="project.loadDemo()" />
      </v-list>
    </v-menu>
  </v-app-bar>
</template>
