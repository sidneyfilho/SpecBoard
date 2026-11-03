import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { emptyFilters, matchesTask } from '@/domain/search'
import { mediaStorage } from '@/infrastructure/media-storage'
import { useProjectStore } from './project'

/** Somente estado transitório de interface (filtros, seleção, preferências). */
export const useUiStore = defineStore('ui', () => {
  const project = useProjectStore()
  const selectedTaskId = ref<string | null>(null)
  const filters = ref(emptyFilters())
  const theme = ref<'dark' | 'light'>((localStorage.getItem('specboard.theme') as 'dark' | 'light') || 'dark')
  const drawer = ref(true)
  const openDialog = ref(false)
  const mediaDialog = ref(false)
  const taskEditor = ref<{ mode: 'create' | 'edit'; taskId?: string; specId?: string } | null>(null)

  // Mapas de logo e capa persistidos por ID do projeto
  const logos = ref<Record<string, string>>({})
  const covers = ref<Record<string, string>>({})

  // Leitura inicial síncrona do localStorage
  try {
    logos.value = JSON.parse(localStorage.getItem('specboard.projectLogos') || '{}')
  } catch {
    logos.value = {}
  }
  try {
    covers.value = JSON.parse(localStorage.getItem('specboard.projectCovers') || '{}')
  } catch {
    covers.value = {}
  }

  // Carrega e sincroniza com IndexedDB (sem limitação de 5MB)
  void mediaStorage.getAll().then((data) => {
    for (const [id, m] of Object.entries(data)) {
      if (m.logo) logos.value[id] = m.logo
      if (m.cover) covers.value[id] = m.cover
    }
  })

  const currentProjectId = computed(() => project.model.project.id || 'default')

  const currentLogo = computed(() => {
    return logos.value[currentProjectId.value] || null
  })

  const currentCover = computed(() => {
    return covers.value[currentProjectId.value] || null
  })

  function getLogoForProject(projectId: string): string | null {
    return logos.value[projectId] || null
  }

  async function setProjectLogo(logoUrlOrData: string | null) {
    const id = currentProjectId.value
    if (logoUrlOrData) {
      logos.value[id] = logoUrlOrData
    } else {
      delete logos.value[id]
    }
    await mediaStorage.save(id, { logo: logoUrlOrData })
  }

  async function setProjectCover(coverUrlOrData: string | null) {
    const id = currentProjectId.value
    if (coverUrlOrData) {
      covers.value[id] = coverUrlOrData
    } else {
      delete covers.value[id]
    }
    await mediaStorage.save(id, { cover: coverUrlOrData })
  }

  watch(theme, (t) => localStorage.setItem('specboard.theme', t))

  const filteredTasks = computed(() => project.model.tasks.filter((t) => matchesTask(t, filters.value)))
  const selectedTask = computed(() => (selectedTaskId.value ? (project.taskById.get(selectedTaskId.value) ?? null) : null))
  const hasFilters = computed(() => {
    const f = filters.value
    return !!(f.query || f.statuses.length || f.priorities.length || f.specId)
  })
  function clearFilters() {
    filters.value = emptyFilters()
  }
  return {
    selectedTaskId,
    filters,
    theme,
    drawer,
    openDialog,
    mediaDialog,
    taskEditor,
    getLogoForProject,
    currentLogo,
    currentCover,
    setProjectLogo,
    setProjectCover,
    filteredTasks,
    selectedTask,
    hasFilters,
    clearFilters,
  }
})
