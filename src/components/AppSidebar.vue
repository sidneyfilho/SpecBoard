<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { NAV } from '@/app/labels'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'

const project = useProjectStore()
const ui = useUiStore()
const route = useRoute()
const { mdAndDown } = useDisplay()

const projectMenu = ref(false)

async function switchProject(root: string) {
  projectMenu.value = false
  if (root !== project.model.project.repositoryRoot || project.isDemo) {
    await project.open(root)
  }
}

function switchDemo() {
  projectMenu.value = false
  project.loadDemo()
}

function openNewProjectDialog() {
  projectMenu.value = false
  ui.openDialog = true
}

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
const drawerModel = computed({
  get: () => (mdAndDown.value ? ui.drawer : true),
  set: (v: boolean) => (ui.drawer = v),
})
</script>

<template>
  <v-navigation-drawer v-model="drawerModel" :permanent="!mdAndDown" :temporary="mdAndDown" width="248" color="surface" border>
    <div class="d-flex align-center ga-3 pa-4">
      <v-avatar size="36" rounded="lg" class="elevation-2">
        <v-img src="/specboard-icon.png" alt="SpecBoard Logo" cover />
      </v-avatar>
      <div>
        <div class="text-subtitle-1 font-weight-bold" style="line-height: 1.2;">SpecBoard</div>
        <div class="text-caption text-medium-emphasis">AI Development Planner</div>
      </div>
    </div>

    <div class="px-3 pb-3">
      <v-menu v-model="projectMenu" :close-on-content-click="false" location="bottom start" offset="6">
        <template #activator="{ props }">
          <button
            v-bind="props"
            type="button"
            class="sb-project-btn pa-2 d-flex align-center ga-2 text-left"
            aria-label="Trocar ou gerenciar projetos"
          >
            <v-avatar size="28" rounded="sm" class="border flex-shrink-0" color="surface">
              <v-img v-if="ui.currentLogo" :src="ui.currentLogo" cover />
              <v-icon v-else icon="mdi-folder-outline" size="18" color="primary" />
            </v-avatar>
            <div class="flex-grow-1 overflow-hidden" style="min-width: 0;">
              <div class="text-body-2 font-weight-bold text-truncate" style="line-height: 1.25; color: #ffffff;">
                {{ project.model.project.name }}
              </div>
              <div class="text-caption text-medium-emphasis text-truncate" style="font-size: 0.72rem;">
                {{ project.isDemo ? 'dados de demonstração' : project.model.project.repositoryRoot }}
              </div>
            </div>
            <v-icon icon="mdi-chevron-down" size="18" class="text-medium-emphasis flex-shrink-0 ml-1" />
          </button>
        </template>

        <v-card class="sb-panel" min-width="290" max-width="340">
          <div class="px-3 py-2 d-flex align-center justify-space-between border-b">
            <div class="d-flex align-center ga-2 text-caption font-weight-bold text-uppercase" style="letter-spacing: 0.05em;">
              <v-icon icon="mdi-swap-horizontal" size="16" color="primary" />
              <span>Trocar de Projeto</span>
            </div>
            <v-chip v-if="project.recentProjects.length" size="x-small" variant="tonal" color="primary">
              {{ project.recentProjects.length }} salvo{{ project.recentProjects.length === 1 ? '' : 's' }}
            </v-chip>
          </div>

          <div v-if="project.recentProjects.length" style="max-height: 240px; overflow-y: auto;">
            <v-list density="compact" class="py-1">
              <v-list-item
                v-for="p in project.recentProjects"
                :key="p.root"
                :active="!project.isDemo && p.root === project.model.project.repositoryRoot"
                rounded="md"
                class="mx-1 my-1 px-2"
                @click="switchProject(p.root)"
              >
                <template #prepend>
                  <v-avatar size="26" rounded="sm" color="surface-variant" class="border mr-2 flex-shrink-0">
                    <v-img v-if="ui.getLogoForProject(p.id)" :src="ui.getLogoForProject(p.id)!" cover />
                    <v-icon v-else icon="mdi-folder-outline" size="16" color="primary" />
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium text-body-2 d-flex align-center justify-space-between">
                  <span class="text-truncate">{{ p.name }}</span>
                  <v-icon
                    v-if="!project.isDemo && p.root === project.model.project.repositoryRoot"
                    icon="mdi-check"
                    color="success"
                    size="16"
                    class="ml-1 flex-shrink-0"
                  />
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption text-truncate sb-mono" style="font-size: 0.7rem;">
                  {{ p.root }}
                </v-list-item-subtitle>

                <template #append>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="medium-emphasis"
                    class="ml-1"
                    title="Remover do histórico"
                    @click.stop="project.removeRecentProject(p.root)"
                  >
                    <v-icon icon="mdi-close" size="14" />
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>
          <div v-else class="px-3 py-4 text-center text-caption text-medium-emphasis">
            Nenhum projeto salvo no histórico.
          </div>

          <v-divider />

          <v-list density="compact" class="py-1">
            <v-list-item
              prepend-icon="mdi-flask-outline"
              title="Dados de demonstração (Alvorland)"
              :active="project.isDemo"
              rounded="md"
              class="mx-1 my-1"
              @click="switchDemo"
            >
              <template #append>
                <v-icon v-if="project.isDemo" icon="mdi-check" color="success" size="16" />
              </template>
            </v-list-item>

            <v-list-item
              prepend-icon="mdi-folder-plus-outline"
              title="Abrir outra pasta / projeto…"
              rounded="md"
              class="mx-1 my-1 text-primary"
              @click="openNewProjectDialog"
            />
          </v-list>
        </v-card>
      </v-menu>
    </div>

    <v-list nav density="compact" class="sb-nav px-2" aria-label="Navegação principal">
      <v-list-item
        v-for="n in NAV"
        :key="n.to"
        :to="n.to"
        :active="isActive(n.to)"
        :prepend-icon="n.icon"
        :title="n.title"
        rounded="lg"
        @click="mdAndDown && (ui.drawer = false)"
      />
    </v-list>

    <template #append>
      <div class="pa-3">
        <div class="text-overline text-medium-emphasis">Projeto</div>
        <div v-if="project.git.available" class="d-flex flex-column ga-1 text-body-2">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-source-branch" size="18" />
            <span>{{ project.git.branch }}</span>
            <v-icon
              :icon="project.git.dirty ? 'mdi-circle-edit-outline' : 'mdi-check-circle'"
              :color="project.git.dirty ? 'warning' : 'success'"
              size="16"
            />
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ project.git.dirty ? `${project.git.changed?.length} alteração(ões) locais` : 'Sem alterações locais' }}
            <template v-if="project.git.ahead || project.git.behind"> · ↑{{ project.git.ahead ?? 0 }} ↓{{ project.git.behind ?? 0 }}</template>
          </div>
        </div>
        <div v-else class="text-caption text-medium-emphasis">
          Git indisponível<template v-if="project.isDemo"> (dados de demonstração)</template>
          <template v-else-if="project.git.reason">: {{ project.git.reason }}</template>
        </div>
        <v-alert type="info" variant="text" density="compact" class="mt-2 pa-0 text-caption" icon="mdi-information-outline">
          Agentes externos executam o trabalho. O SpecBoard só planeja e documenta.
        </v-alert>
      </div>
    </template>
  </v-navigation-drawer>
</template>
