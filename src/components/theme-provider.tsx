'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { THEME_PRESETS, FONT_OPTIONS, getThemeById, getFontById, STATUS_COLORS, type ThemeColors, type ThemePreset } from '@/lib/themes'

type ColorMode = 'light' | 'dark' | 'system'

export type UserPreferences = {
  id: string
  user_id: string
  theme_preset: string
  color_mode: ColorMode
  font_family: string
  custom_primary: string | null
  custom_accent: string | null
  created_at: string
  updated_at: string
}

type ThemeContextType = {
  preferences: UserPreferences | null
  isLoading: boolean
  colorMode: ColorMode
  resolvedMode: 'light' | 'dark'
  themePreset: string
  fontFamily: string
  customTheme: ThemePreset | null
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
  setCustomTheme: (theme: ThemePreset) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function applyThemeColors(root: HTMLElement, colors: ThemeColors, mode: 'light' | 'dark') {
  const mapping: Record<string, string> = {
    background: '--background',
    foreground: '--foreground',
    card: '--card',
    cardForeground: '--card-foreground',
    popover: '--popover',
    popoverForeground: '--popover-foreground',
    primary: '--primary',
    primaryForeground: '--primary-foreground',
    secondary: '--secondary',
    secondaryForeground: '--secondary-foreground',
    muted: '--muted',
    mutedForeground: '--muted-foreground',
    accent: '--accent',
    accentForeground: '--accent-foreground',
    border: '--border',
    input: '--input',
    ring: '--ring',
  }

  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = mapping[key]
    if (cssVar) {
      root.style.setProperty(cssVar, value)
    }
  })

  // Apply status colors based on mode
  const statusColors = STATUS_COLORS[mode]
  root.style.setProperty('--status-on-track', statusColors.onTrack)
  root.style.setProperty('--status-at-risk', statusColors.atRisk)
  root.style.setProperty('--status-behind', statusColors.behind)
}

export function ThemeProvider({
  children,
  initialPreferences,
}: {
  children: React.ReactNode
  initialPreferences?: UserPreferences | null
}) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(initialPreferences ?? null)
  const [isLoading, setIsLoading] = useState(!initialPreferences)
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>('light')
  const [customTheme, setCustomThemeState] = useState<ThemePreset | null>(null)

  const supabase = createClient()

  // Load custom theme from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('custom-cloned-theme')
    if (saved) {
      try {
        setCustomThemeState(JSON.parse(saved))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Listen to system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemMode(mediaQuery.matches ? 'dark' : 'light')

    const handler = (e: MediaQueryListEvent) => setSystemMode(e.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Fetch preferences if not provided
  useEffect(() => {
    if (initialPreferences !== undefined) {
      setIsLoading(false)
      return
    }

    async function fetchPreferences() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setPreferences(data as UserPreferences)
      }
      setIsLoading(false)
    }

    fetchPreferences()
  }, [initialPreferences, supabase])

  const colorMode = (preferences?.color_mode ?? 'system') as ColorMode
  const resolvedMode = colorMode === 'system' ? systemMode : colorMode
  const themePreset = preferences?.theme_preset ?? 'aurora'
  const fontFamily = preferences?.font_family ?? 'geist'

  // Apply theme to document
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    // Use custom theme if selected, otherwise lookup from presets
    const theme = themePreset === 'custom-cloned' && customTheme
      ? customTheme
      : getThemeById(themePreset)
    const font = getFontById(fontFamily)

    // Apply color mode class
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedMode)

    // Apply theme colors
    if (theme) {
      const colors = resolvedMode === 'dark' ? theme.dark : theme.light
      applyThemeColors(root, colors, resolvedMode)
    }

    // Apply font
    if (font) {
      root.style.setProperty('--font-sans', `var(${font.variable}), ${font.fallback}`)
    }
  }, [themePreset, fontFamily, resolvedMode, customTheme])

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const newPrefs = { ...preferences, ...updates, updated_at: new Date().toISOString() }
      setPreferences(newPrefs as UserPreferences)

      await supabase
        .from('user_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
    },
    [preferences, supabase]
  )

  const setCustomTheme = useCallback((theme: ThemePreset) => {
    setCustomThemeState(theme)
    localStorage.setItem('custom-cloned-theme', JSON.stringify(theme))
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        preferences,
        isLoading,
        colorMode,
        resolvedMode,
        themePreset,
        fontFamily,
        customTheme,
        updatePreferences,
        setCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
