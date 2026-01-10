'use client'

import { useState, useEffect } from 'react'
import { useTheme, type UserPreferences } from '@/components/theme-provider'
import { THEME_PRESETS, FONT_OPTIONS, type ThemePreset } from '@/lib/themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ThemeSettingsProps {
  initialPreferences: UserPreferences | null
}

type ExtractedTheme = ThemePreset & {
  fonts?: string[]
  colorsFound?: number
}

export function ThemeSettings({ initialPreferences }: ThemeSettingsProps) {
  const { updatePreferences, themePreset, fontFamily, colorMode, setCustomTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedTheme, setExtractedTheme] = useState<ExtractedTheme | null>(null)
  const [extractError, setExtractError] = useState<string | null>(null)

  // Load any previously extracted theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('custom-cloned-theme')
    if (saved) {
      try {
        setExtractedTheme(JSON.parse(saved))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  const handleExtractTheme = async () => {
    if (!websiteUrl) return

    setExtracting(true)
    setExtractError(null)

    // Auto-add https:// if no protocol specified
    let url = websiteUrl.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    try {
      const response = await fetch('/api/extract-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract theme')
      }

      const theme: ExtractedTheme = {
        ...data.theme,
        fonts: data.fonts,
        colorsFound: data.colorsFound,
      }

      setExtractedTheme(theme)
      localStorage.setItem('custom-cloned-theme', JSON.stringify(theme))
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed to extract theme')
    } finally {
      setExtracting(false)
    }
  }

  const handleApplyExtractedTheme = async () => {
    if (!extractedTheme) return

    setSaving(true)
    // Store the custom theme and set it as active
    setCustomTheme(extractedTheme)
    await updatePreferences({ theme_preset: 'custom-cloned' })
    setSaving(false)
  }

  const handleClearCustomTheme = () => {
    setExtractedTheme(null)
    setWebsiteUrl('')
    localStorage.removeItem('custom-cloned-theme')
    if (themePreset === 'custom-cloned') {
      handleThemeChange('aurora')
    }
  }

  const handleThemeChange = async (themeId: string) => {
    setSaving(true)
    await updatePreferences({ theme_preset: themeId })
    setSaving(false)
  }

  const handleFontChange = async (fontId: string) => {
    setSaving(true)
    await updatePreferences({ font_family: fontId })
    setSaving(false)
  }

  const handleColorModeChange = async (mode: 'light' | 'dark' | 'system') => {
    setSaving(true)
    await updatePreferences({ color_mode: mode })
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Color Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Color Mode</CardTitle>
          <CardDescription>Choose between light, dark, or system preference</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[
              { id: 'light', label: 'Light', icon: '☀️' },
              { id: 'dark', label: 'Dark', icon: '🌙' },
              { id: 'system', label: 'System', icon: '💻' },
            ].map(({ id, label, icon }) => (
              <Button
                key={id}
                variant={colorMode === id ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => handleColorModeChange(id as 'light' | 'dark' | 'system')}
                disabled={saving}
              >
                <span>{icon}</span>
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clone from Website */}
      <Card>
        <CardHeader>
          <CardTitle>Clone from Website</CardTitle>
          <CardDescription>
            Paste a URL to extract colors and style from any website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://vercel.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={extracting}
              onKeyDown={(e) => e.key === 'Enter' && handleExtractTheme()}
            />
            <Button
              onClick={handleExtractTheme}
              disabled={extracting || !websiteUrl}
            >
              {extracting ? 'Extracting...' : 'Extract'}
            </Button>
          </div>

          {extractError && (
            <p className="text-sm text-destructive">{extractError}</p>
          )}

          {extractedTheme && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{extractedTheme.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {extractedTheme.colorsFound} colors extracted
                    {extractedTheme.fonts && extractedTheme.fonts.length > 0 && (
                      <> · Fonts: {extractedTheme.fonts.join(', ')}</>
                    )}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <div
                    className="w-8 h-8 rounded-full shadow-sm border"
                    style={{ backgroundColor: extractedTheme.preview.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-8 h-8 rounded-full shadow-sm border"
                    style={{ backgroundColor: extractedTheme.preview.accent }}
                    title="Accent"
                  />
                  <div
                    className="w-8 h-8 rounded-full shadow-sm border"
                    style={{ backgroundColor: extractedTheme.preview.bg }}
                    title="Background"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleApplyExtractedTheme}
                  disabled={saving}
                  className="flex-1"
                  variant={themePreset === 'custom-cloned' ? 'secondary' : 'default'}
                >
                  {themePreset === 'custom-cloned' ? 'Applied' : 'Apply Theme'}
                </Button>
                <Button
                  onClick={handleClearCustomTheme}
                  variant="outline"
                  disabled={saving}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Select a color theme that inspires you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {THEME_PRESETS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                disabled={saving}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all text-left',
                  'hover:scale-[1.02] hover:shadow-md disabled:opacity-50',
                  themePreset === theme.id
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {/* Color preview */}
                <div className="flex gap-1.5 mb-3">
                  <div
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ backgroundColor: theme.preview.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                  <div
                    className="w-8 h-8 rounded-full border shadow-sm"
                    style={{ backgroundColor: theme.preview.bg }}
                  />
                </div>
                <div className="font-semibold text-sm">{theme.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {theme.description}
                </div>
                {themePreset === theme.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Font Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Font</CardTitle>
          <CardDescription>Choose a typeface for the interface</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.id}
                onClick={() => handleFontChange(font.id)}
                disabled={saving}
                className={cn(
                  'w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between',
                  'disabled:opacity-50',
                  fontFamily === font.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                style={{ fontFamily: `var(${font.variable}), ${font.fallback}` }}
              >
                <div>
                  <div className="font-semibold text-lg">{font.name}</div>
                  <div className="text-sm text-muted-foreground">{font.description}</div>
                  <div className="text-xs mt-1 opacity-70">
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
                {fontFamily === font.id && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Status Colors Preview</CardTitle>
          <CardDescription>These colors indicate goal progress across all themes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-status-on-track/15 border border-status-on-track/30">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-status-on-track" />
                <span className="font-semibold text-status-on-track">On Track</span>
              </div>
              <p className="text-xs text-muted-foreground">Meeting or exceeding target</p>
            </div>
            <div className="p-4 rounded-lg bg-status-at-risk/15 border border-status-at-risk/30">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-status-at-risk" />
                <span className="font-semibold text-status-at-risk">At Risk</span>
              </div>
              <p className="text-xs text-muted-foreground">Slightly behind schedule</p>
            </div>
            <div className="p-4 rounded-lg bg-status-behind/15 border border-status-behind/30">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-status-behind" />
                <span className="font-semibold text-status-behind">Behind</span>
              </div>
              <p className="text-xs text-muted-foreground">Needs immediate attention</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
