<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useTheme, useDisplay } from 'vuetify'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import OpenProjectDialog from '@/components/OpenProjectDialog.vue'
import ConflictDialog from '@/components/ConflictDialog.vue'
import TaskEditorDialog from '@/components/TaskEditorDialog.vue'
import TaskModal from '@/components/TaskModal.vue'
import ProjectMediaDialog from '@/components/ProjectMediaDialog.vue'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
const theme = useTheme()
const { mdAndDown } = useDisplay()

watch(
  () => ui.theme,
  (t) => theme.change(t === 'dark' ? 'specboardDark' : 'specboardLight'),
  { immediate: true },
)

let timer: number | undefined
onMounted(() => {
  void project.restore()
  timer = window.setInterval(() => void project.checkExternal(), 5000)
})
onBeforeUnmount(() => window.clearInterval(timer))

const snackbar = computed({
  get: () => !!project.notice,
  set: (v: boolean) => {
    if (!v) project.notice = null
  },
})
</script>

<template>
  <v-app>
    <AppSidebar />
    <AppTopbar />
    <v-main>
      <v-container fluid class="pa-4 pa-md-5" :class="{ 'pl-md-5': !mdAndDown }">
        <v-alert v-if="project.isDemo" type="info" variant="tonal" density="compact" class="mb-3" icon="mdi-flask-outline">
          <strong>Dados de demonstração</strong> — projeto fictício somente leitura.
          <template #append>
            <v-btn size="small" color="primary" @click="ui.openDialog = true">Abrir repositório</v-btn>
          </template>
        </v-alert>
        <v-alert
          v-if="project.externalChanges.length"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
          icon="mdi-file-alert-outline"
        >
          Arquivos alterados fora do SpecBoard: <span class="sb-mono">{{ project.externalChanges.join(', ') }}</span>
          <template #append>
            <v-btn size="small" color="warning" @click="project.reload()">Recarregar do disco</v-btn>
          </template>
        </v-alert>
        <v-alert v-if="project.error" type="error" variant="tonal" density="compact" class="mb-3" closable @click:close="project.error = null">
          {{ project.error }}
        </v-alert>
        <v-progress-linear v-if="project.loading" indeterminate color="primary" class="mb-3" />
        <router-view />
      </v-container>
    </v-main>
    <OpenProjectDialog />
    <ProjectMediaDialog />
    <ConflictDialog />
    <TaskModal />
    <TaskEditorDialog />
    <v-snackbar v-model="snackbar" :color="project.notice?.type" timeout="3500" location="bottom right">
      {{ project.notice?.text }}
    </v-snackbar>
  </v-app>
</template>
