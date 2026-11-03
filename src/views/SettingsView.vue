<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useUiStore } from '@/stores/ui'
import { repositoryApi } from '@/infrastructure/api-client'

const project = useProjectStore()
const ui = useUiStore()
const p = project.model.project

const gitFolderPath = ref(project.currentGitRoot)
const isCustomGitRoot = ref(Boolean(project.customGitRoots[project.model.project.id] || project.customGitRoots[project.model.project.repositoryRoot]))
const testing = ref(false)
const gitFeedback = ref<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
const showChangedList = ref(false)

watch(
  () => [project.model.project.id, project.currentGitRoot],
  () => {
    gitFolderPath.value = project.currentGitRoot
    isCustomGitRoot.value = Boolean(
      project.customGitRoots[project.model.project.id] ||
      project.customGitRoots[project.model.project.repositoryRoot]
    )
  },
  { immediate: true },
)

async function pickGitFolder() {
  testing.value = true
  gitFeedback.value = null
  try {
    const res = await repositoryApi.pickFolder()
    if (res.path) {
      gitFolderPath.value = res.path
    }
  } catch (e) {
    gitFeedback.value = { text: (e as Error).message, type: 'error' }
  } finally {
    testing.value = false
  }
}

async function applyGitFolder() {
  if (project.isDemo) {
    gitFeedback.value = { text: 'Configuração não disponível em modo de demonstração.', type: 'info' }
    return
  }
  testing.value = true
  gitFeedback.value = null
  try {
    const gitRes = await project.setProjectGitRoot(gitFolderPath.value)
    isCustomGitRoot.value = Boolean(
      project.customGitRoots[project.model.project.id] ||
      project.customGitRoots[project.model.project.repositoryRoot]
    )
    if (gitRes.available) {
      gitFeedback.value = {
        text: `Git conectado com sucesso na branch "${gitRes.branch}"!`,
        type: 'success',
      }
    } else {
      gitFeedback.value = {
        text: `Pasta salva, porém o Git relatou: ${gitRes.reason ?? 'Não é um repositório Git válido.'}`,
        type: 'error',
      }
    }
  } catch (e) {
    gitFeedback.value = { text: (e as Error).message, type: 'error' }
  } finally {
    testing.value = false
  }
}

async function resetGitFolder() {
  if (project.isDemo) return
  testing.value = true
  gitFeedback.value = null
  try {
    gitFolderPath.value = project.model.project.repositoryRoot
    const gitRes = await project.setProjectGitRoot(null)
    isCustomGitRoot.value = false
    if (gitRes.available) {
      gitFeedback.value = { text: 'Restaurado para a raiz padrão do projeto.', type: 'success' }
    } else {
      gitFeedback.value = { text: 'Restaurado para a raiz padrão. ' + (gitRes.reason ?? ''), type: 'info' }
    }
  } catch (e) {
    gitFeedback.value = { text: (e as Error).message, type: 'error' }
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <h2 class="text-h5 mb-3">Configurações</h2>

  <!-- Repositório Git -->
  <div class="sb-panel pa-4 mb-3">
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-subtitle-2 d-flex align-center ga-2">
        <v-icon icon="mdi-source-branch" color="primary" />
        <span>Controle de Versão (Git)</span>
      </div>
      <v-chip
        v-if="project.isDemo"
        size="small"
        color="secondary"
        variant="tonal"
      >
        Modo Demonstração
      </v-chip>
      <v-chip
        v-else-if="project.git.available"
        size="small"
        color="success"
        variant="tonal"
        prepend-icon="mdi-check-circle"
      >
        Git Conectado: {{ project.git.branch }}
      </v-chip>
      <v-chip
        v-else
        size="small"
        color="error"
        variant="tonal"
        prepend-icon="mdi-alert-circle"
      >
        Git Indisponível
      </v-chip>
    </div>

    <div class="text-body-2 text-medium-emphasis mb-3">
      Por padrão, o SpecBoard busca o Git na raiz do projeto. Caso sua documentação esteja em uma subpasta (como <code>doc-alvorland/pm-md</code>) e o repositório <code>.git</code> esteja na pasta principal, selecione a pasta do repositório Git abaixo.
    </div>

    <!-- Status atual do Git -->
    <div v-if="!project.isDemo" class="d-flex flex-wrap ga-2 align-center mb-3">
      <v-chip size="small" variant="outlined" prepend-icon="mdi-folder-outline">
        Pasta ativa: {{ project.git.gitRoot ?? project.currentGitRoot }}
      </v-chip>
      <v-chip
        v-if="isCustomGitRoot"
        size="small"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-tune-variant"
      >
        Pasta personalizada
      </v-chip>
      <template v-if="project.git.available">
        <v-chip
          size="small"
          :color="project.git.dirty ? 'warning' : 'success'"
          variant="tonal"
          :prepend-icon="project.git.dirty ? 'mdi-file-alert-outline' : 'mdi-check'"
        >
          {{ project.git.dirty ? `${project.git.changed?.length ?? 0} alteração(ões)` : 'Working tree limpa' }}
        </v-chip>
        <v-chip
          v-if="project.git.ahead || project.git.behind"
          size="small"
          color="info"
          variant="tonal"
          prepend-icon="mdi-sync"
        >
          ↑ {{ project.git.ahead ?? 0 }} / ↓ {{ project.git.behind ?? 0 }}
        </v-chip>
      </template>
    </div>

    <v-alert
      v-if="!project.isDemo && !project.git.available"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
      icon="mdi-information-outline"
    >
      {{ project.git.reason ?? 'Nenhum repositório Git detectado na pasta ativa.' }}
    </v-alert>

    <!-- Seletor de pasta -->
    <div class="d-flex flex-column ga-2">
      <v-text-field
        v-model="gitFolderPath"
        label="Pasta do Repositório Git (.git)"
        placeholder="C:\Users\sidpf\Documentos\Desenvolvimento\MeuProjeto"
        variant="outlined"
        density="comfortable"
        hide-details
        :disabled="project.isDemo || testing"
      >
        <template #append-inner>
          <v-btn
            icon
            variant="text"
            size="small"
            :loading="testing"
            :disabled="project.isDemo"
            aria-label="Escolher pasta no Windows"
            title="Escolher pasta no Windows…"
            @click="pickGitFolder"
          >
            <v-icon icon="mdi-folder-open-outline" />
          </v-btn>
        </template>
      </v-text-field>

      <div class="d-flex flex-wrap ga-2 mt-1">
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-check"
          :loading="testing"
          :disabled="project.isDemo"
          @click="applyGitFolder"
        >
          Salvar e Conectar Git
        </v-btn>
        <v-btn
          v-if="isCustomGitRoot"
          variant="outlined"
          prepend-icon="mdi-restore"
          :loading="testing"
          :disabled="project.isDemo"
          @click="resetGitFolder"
        >
          Restaurar Padrão
        </v-btn>
        <v-btn
          v-if="project.git.available && project.git.changed && project.git.changed.length > 0"
          variant="text"
          size="small"
          :prepend-icon="showChangedList ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          @click="showChangedList = !showChangedList"
        >
          {{ showChangedList ? 'Ocultar arquivos alterados' : `Ver ${project.git.changed.length} arquivo(s) modificado(s)` }}
        </v-btn>
      </div>

      <!-- Feedback de teste/salvamento -->
      <v-alert
        v-if="gitFeedback"
        :type="gitFeedback.type"
        variant="tonal"
        density="compact"
        class="mt-2"
        closable
        @click:close="gitFeedback = null"
      >
        {{ gitFeedback.text }}
      </v-alert>

      <!-- Lista de arquivos alterados (se expandido) -->
      <v-expand-transition>
        <div v-if="showChangedList && project.git.changed && project.git.changed.length > 0" class="mt-2 pa-2 rounded bg-surface-variant">
          <div class="text-caption font-weight-bold mb-1">Arquivos alterados no repositório:</div>
          <div
            v-for="item in project.git.changed"
            :key="item"
            class="sb-mono text-caption text-truncate py-0.5"
          >
            {{ item }}
          </div>
        </div>
      </v-expand-transition>
    </div>
  </div>

  <!-- Projeto .specboard/project.yaml -->
  <div class="sb-panel pa-4 mb-3">
    <div class="text-subtitle-2 mb-2">Projeto (.specboard/project.yaml)</div>
    <v-table density="compact" class="bg-transparent">
      <tbody>
        <tr><td>Nome</td><td>{{ project.model.project.name }}</td></tr>
        <tr><td>ID</td><td>{{ project.model.project.id }}</td></tr>
        <tr><td>Raiz do Projeto</td><td class="sb-mono">{{ project.model.project.repositoryRoot }}</td></tr>
        <tr><td>Pasta Git Atual</td><td class="sb-mono">{{ project.currentGitRoot }}</td></tr>
        <tr><td>Diretório de Specs</td><td class="sb-mono">{{ project.model.project.specsDirectory }}</td></tr>
        <tr><td>Constituição</td><td class="sb-mono">{{ p.constitutionPath ?? '—' }}</td></tr>
        <tr><td>Instruções de agentes</td><td class="sb-mono">{{ p.agentInstructionsPath ?? '—' }}</td></tr>
      </tbody>
    </v-table>
  </div>

  <!-- Preferências de interface -->
  <div class="sb-panel pa-4">
    <div class="text-subtitle-2 mb-2">Preferências de interface</div>
    <v-switch :model-value="ui.theme === 'dark'" label="Tema escuro" color="primary" hide-details @update:model-value="ui.theme = $event ? 'dark' : 'light'" />
    <v-btn class="mt-3" variant="tonal" prepend-icon="mdi-folder-open-outline" @click="ui.openDialog = true">Abrir outro repositório</v-btn>
  </div>
</template>
