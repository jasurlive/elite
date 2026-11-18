import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next, useTranslation } from 'react-i18next'
import type { ComponentType, SVGProps } from 'react'
import { GB, RU, UZ } from 'country-flag-icons/react/3x2'
import en from './en'
import ru from './ru'
import uz from './uz'
import { slug } from '../hooks/LOCAL/useHouse'

type Flag = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>
export const LANGUAGES = [
  { code: 'uz', flag: UZ as Flag },
  { code: 'en', flag: GB as Flag },
  { code: 'ru', flag: RU as Flag },
] as const
export type Lang = (typeof LANGUAGES)[number]['code']

// the picked language is remembered in localStorage ("lang"); first visit: browser language, else english
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ru: { translation: ru }, uz: { translation: uz } },
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true, // ru-RU → ru
    fallbackLng: 'en',
    detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: 'lang', caches: ['localStorage'] },
    interpolation: { escapeValue: false }, // react escapes already
  })

const syncHtmlLang = (lng: string) => document.documentElement.setAttribute('lang', lng)
syncHtmlLang(i18n.resolvedLanguage ?? 'en')
i18n.on('languageChanged', syncHtmlLang)

export const currentLang = () => (i18n.resolvedLanguage ?? 'en') as Lang
export default i18n

// translated name of a room / camera view: its label is the key (via its url slug)
export function usePlace() {
  const { t } = useTranslation()
  return (label: string) => t(`place.${slug(label) as keyof typeof en.place}`)
}
