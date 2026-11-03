<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { repositoryApi } from '@/infrastructure/api-client'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
const root = ref('')
const exampleRoot = ref<string | null>(null)
const busy = ref(false)
const err = ref<string | null>(null)

async function loadInfo() {
  try {
    exampleRoot.value = (await repositoryApi.info()).exampleRoot
  } catch {
    exampleRoot.value = null
  }
}
onMounted(loadInfo)
watch(
  () => ui.openDialog,
  (v) => {
    if (v) {
      err.value = null
      void loadInfo()
    }
  },
)

async function submit(path: string) {
  if (!path.trim()) return
  busy.value = true
  err.value = null
  const ok = await project.open(path)
  busy.value = false
  if (ok) ui.openDialog = false
  else err.value = project.error
}

async function browseFolder() {
  busy.value = true
  err.value = null
  try {
    const res = await repositoryApi.pickFolder()
    if (res.path) {
      root.value = res.path
      await submit(res.path)
    }
  } catch (e) {
    err.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <v-dialog v-model="ui.openDialog" max-width="560">
    <v-card>
      <v-card-title class="pt-4">Abrir repositório</v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-3">
          Selecione a pasta do repositório contendo <span class="sb-mono">.specboard/project.yaml</span>. O acesso a arquivos fica restrito a ela.
        </p>

        <div class="mb-3">
          <v-btn
            block
            color="primary"
            variant="tonal"
            size="large"
            prepend-icon="mdi-folder-search-outline"
            :loading="busy"
            @click="browseFolder"
          >
            Escolher pasta no Windows…
          </v-btn>
        </div>

        <div v-if="project.recentProjects.length" class="mb-4">
          <div class="text-caption font-weight-bold text-medium-emphasis mb-2 d-flex align-center ga-1">
            <v-icon icon="mdi-history" size="16" />
            <span>Projetos salvos / recentes:</span>
          </div>
          <v-list density="compact" class="sb-panel py-1" style="max-height: 170px; overflow-y: auto;">
            <v-list-item
              v-for="p in project.recentProjects"
              :key="p.root"
              :active="!project.isDemo && p.root === project.model.project.repositoryRoot"
              rounded="md"
              class="mx-1 my-1"
              @click="submit(p.root)"
            >
              <template #prepend>
                <v-avatar size="24" rounded="sm" color="surface-variant" class="border mr-2 flex-shrink-0">
                  <v-img v-if="ui.getLogoForProject(p.id)" :src="ui.getLogoForProject(p.id)!" cover />
                  <v-icon v-else icon="mdi-folder-outline" size="14" color="primary" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium text-body-2 d-flex align-center justify-space-between">
                <span>{{ p.name }}</span>
                <v-icon
                  v-if="!project.isDemo && p.root === project.model.project.repositoryRoot"
                  icon="mdi-check"
                  color="success"
                  size="16"
                  class="ml-1 flex-shrink-0"
                />
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption sb-mono text-truncate">{{ p.root }}</v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="medium-emphasis"
                  title="Remover do histórico"
                  @click.stop="project.removeRecentProject(p.root)"
                >
                  <v-icon icon="mdi-close" size="14" />
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <div class="text-caption text-medium-emphasis text-center mb-2">ou digite/cole o caminho diretamente:</div>
        <v-text-field v-model="root" label="Caminho do repositório" placeholder="C:\projetos\meu-jogo" autofocus @keyup.enter="submit(root)">
          <template #append-inner>
            <v-btn icon variant="text" size="small" :loading="busy" @click="browseFolder" aria-label="Procurar pasta">
              <v-icon icon="mdi-folder-open-outline" />
            </v-btn>
          </template>
        </v-text-field>
        <v-alert v-if="err" type="error" variant="tonal" density="compact" class="mt-3">{{ err }}</v-alert>
        <v-divider class="my-4" />
        <div class="d-flex flex-wrap ga-2">
          <v-btn v-if="exampleRoot" variant="tonal" prepend-icon="mdi-folder-star-outline" :loading="busy" @click="submit(exampleRoot)">
            Abrir projeto de exemplo
          </v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-flask-outline" @click="project.loadDemo(); ui.openDialog = false">Dados de demonstração</v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="ui.openDialog = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="busy" :disabled="!root.trim()" @click="submit(root)">Abrir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
