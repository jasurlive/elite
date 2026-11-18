import 'i18next'
import type en from './en'

// typed keys: t('menu.house') is checked against en.ts
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof en }
  }
}
