import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'overview', component: () => import('@/views/OverviewView.vue') },
    { path: '/specs', name: 'specs', component: () => import('@/views/SpecsView.vue') },
    { path: '/specs/:id', name: 'spec', component: () => import('@/views/SpecDetailView.vue'), props: true },
    { path: '/tasks', name: 'tasks', component: () => import('@/views/TasksView.vue') },
    { path: '/kanban', name: 'kanban', component: () => import('@/views/KanbanView.vue') },
    { path: '/schedule', name: 'schedule', component: () => import('@/views/PlaceholderView.vue'), props: { title: 'Cronograma', text: 'O cronograma (Gantt) não faz parte do MVP. Estimativas confiáveis de duração estão fora de escopo.' } },
    { path: '/dependencies', name: 'dependencies', component: () => import('@/views/DependenciesView.vue') },
    { path: '/files', name: 'files', component: () => import('@/views/FilesView.vue') },
    { path: '/reports', name: 'reports', component: () => import('@/views/ReportsView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
