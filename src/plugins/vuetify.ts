import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export const vuetify = createVuetify({
  defaults: {
    VBtn: { variant: 'flat', rounded: 'lg', class: 'text-none' },
    VCard: { rounded: 'lg' },
    VChip: { size: 'small', rounded: 'md' },
    VTextField: { variant: 'outlined', density: 'compact', hideDetails: 'auto' },
    VSelect: { variant: 'outlined', density: 'compact', hideDetails: 'auto' },
    VAutocomplete: { variant: 'outlined', density: 'compact', hideDetails: 'auto' },
    VTextarea: { variant: 'outlined', density: 'compact', hideDetails: 'auto' },
  },
  theme: {
    defaultTheme: 'specboardDark',
    themes: {
      specboardDark: {
        dark: true,
        colors: {
          background: '#070c1a',
          surface: '#0d1530',
          'surface-variant': '#141e3d',
          'on-surface-variant': '#b8c4e6',
          primary: '#3b6cff',
          secondary: '#8b5cf6',
          info: '#22d3ee',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      specboardLight: {
        dark: false,
        colors: {
          background: '#f2f5fb',
          surface: '#ffffff',
          'surface-variant': '#e8edf8',
          primary: '#2f5bea',
          secondary: '#7c4ddb',
          info: '#0891b2',
          success: '#16a34a',
          warning: '#d97706',
          error: '#dc2626',
        },
      },
    },
  },
})
