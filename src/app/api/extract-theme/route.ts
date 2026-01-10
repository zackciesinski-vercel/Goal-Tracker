import { NextRequest, NextResponse } from 'next/server'

// Convert hex to OKLCH (approximate conversion)
function hexToOklch(hex: string): string {
  hex = hex.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)

  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb

  const xn = 0.95047, yn = 1.0, zn = 1.08883
  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16/116)

  const l = (116 * f(y / yn)) - 16
  const a = 500 * (f(x / xn) - f(y / yn))
  const bLab = 200 * (f(y / yn) - f(z / zn))

  const L = Math.max(0, Math.min(1, l / 100))
  const C = Math.sqrt(a * a + bLab * bLab) / 150
  const H = ((Math.atan2(bLab, a) * 180 / Math.PI) + 360) % 360

  return `oklch(${L.toFixed(2)} ${C.toFixed(2)} ${Math.round(H)})`
}

function getColorBrightness(hex: string): number {
  hex = hex.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

function getColorSaturation(hex: string): number {
  hex = hex.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) return 0
  const d = max - min
  return l > 0.5 ? d / (2 - max - min) : d / (max + min)
}

function getColorHue(hex: string): number {
  hex = hex.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  if (max === min) return 0

  let h = 0
  const d = max - min

  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return Math.round(h * 360)
}

function isNeutral(hex: string): boolean {
  return getColorSaturation(hex) < 0.15
}

function normalizeHex(hex: string): string {
  hex = hex.replace('#', '').toLowerCase()
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  return '#' + hex
}

// Extract CSS custom properties (modern sites use these for theming)
function extractCssVariables(css: string): Record<string, string> {
  const variables: Record<string, string> = {}

  // Match :root or html or body CSS variable definitions
  const rootRegex = /(?::root|html|body)\s*\{([^}]+)\}/gi
  let match

  while ((match = rootRegex.exec(css)) !== null) {
    const block = match[1]
    const varRegex = /--([\w-]+)\s*:\s*([^;]+)/g
    let varMatch

    while ((varMatch = varRegex.exec(block)) !== null) {
      const name = varMatch[1].toLowerCase()
      const value = varMatch[2].trim()
      variables[name] = value
    }
  }

  return variables
}

// Extract colors with context about where they're used
function extractColorsWithContext(html: string, css: string): {
  backgrounds: string[]
  foregrounds: string[]
  accents: string[]
  allColors: Map<string, number>
} {
  const allColors = new Map<string, number>()
  const backgrounds: string[] = []
  const foregrounds: string[] = []
  const accents: string[] = []

  const addColor = (hex: string, count = 1) => {
    hex = normalizeHex(hex)
    allColors.set(hex, (allColors.get(hex) || 0) + count)
  }

  // Extract all hex colors
  const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g
  for (const match of css.matchAll(hexRegex)) {
    addColor(match[0])
  }
  for (const match of html.matchAll(hexRegex)) {
    addColor(match[0])
  }

  // Extract rgb/rgba colors
  const rgbRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g
  for (const match of [...css.matchAll(rgbRegex), ...html.matchAll(rgbRegex)]) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0')
    const g = parseInt(match[2]).toString(16).padStart(2, '0')
    const b = parseInt(match[3]).toString(16).padStart(2, '0')
    addColor('#' + r + g + b)
  }

  // Look for background colors specifically
  const bgRegex = /background(?:-color)?\s*:\s*([^;}\n]+)/gi
  for (const match of css.matchAll(bgRegex)) {
    const value = match[1].trim()
    const hexMatch = value.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/)
    if (hexMatch) {
      backgrounds.push(normalizeHex(hexMatch[0]))
    }
    const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0')
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0')
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0')
      backgrounds.push('#' + r + g + b)
    }
  }

  // Look for text/foreground colors
  const colorRegex = /(?:^|[^-])color\s*:\s*([^;}\n]+)/gi
  for (const match of css.matchAll(colorRegex)) {
    const value = match[1].trim()
    const hexMatch = value.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/)
    if (hexMatch) {
      foregrounds.push(normalizeHex(hexMatch[0]))
    }
  }

  // Look for accent/brand colors (buttons, links, highlights)
  const accentRegex = /(?:btn|button|link|brand|accent|primary|cta)[\w-]*[^{]*\{[^}]*(?:background|color)\s*:\s*([^;}\n]+)/gi
  for (const match of css.matchAll(accentRegex)) {
    const value = match[1]
    const hexMatch = value.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/)
    if (hexMatch) {
      accents.push(normalizeHex(hexMatch[0]))
    }
  }

  return { backgrounds, foregrounds, accents, allColors }
}

// Extract font families from CSS
function extractFonts(css: string): string[] {
  const fonts: Set<string> = new Set()
  const fontRegex = /font-family:\s*([^;}\n]+)/gi

  for (const match of css.matchAll(fontRegex)) {
    const fontList = match[1]
      .split(',')
      .map(f => f.trim().replace(/["']/g, ''))
      .filter(f =>
        !f.includes('system') &&
        !f.includes('sans-serif') &&
        !f.includes('serif') &&
        !f.includes('monospace') &&
        !f.includes('ui-') &&
        !f.includes('Apple') &&
        !f.includes('Segoe') &&
        !f.includes('Roboto') &&
        f.length > 0
      )
    fontList.forEach(f => fonts.add(f))
  }

  return Array.from(fonts).slice(0, 3)
}

// Determine if the site uses a dark theme
function detectDarkTheme(backgrounds: string[], cssVars: Record<string, string>): boolean {
  // Check CSS variables for dark theme indicators
  const bgVar = cssVars['background'] || cssVars['bg'] || cssVars['background-color'] || ''
  if (bgVar) {
    // Check if the background variable suggests dark
    if (bgVar.includes('0 0 0') || bgVar.includes('#000') || bgVar.includes('rgb(0')) {
      return true
    }
  }

  // Check actual background colors
  if (backgrounds.length > 0) {
    const darkBgs = backgrounds.filter(c => getColorBrightness(c) < 50)
    const lightBgs = backgrounds.filter(c => getColorBrightness(c) > 200)

    // If more dark backgrounds than light, it's a dark theme
    if (darkBgs.length > lightBgs.length) return true

    // Check the first few backgrounds (usually the main ones)
    const primaryBg = backgrounds[0]
    if (primaryBg && getColorBrightness(primaryBg) < 50) return true
  }

  return false
}

// Find the best accent color (saturated, not neutral)
function findAccentColor(
  accents: string[],
  allColors: Map<string, number>,
  isDark: boolean
): string {
  // First try explicit accent colors
  for (const color of accents) {
    if (!isNeutral(color)) {
      const brightness = getColorBrightness(color)
      // For dark themes, accent should be visible (not too dark)
      // For light themes, accent should be visible (not too light)
      if (isDark && brightness > 80) return color
      if (!isDark && brightness < 200) return color
    }
  }

  // Otherwise find the most used saturated color
  const colorsByCount = Array.from(allColors.entries())
    .sort((a, b) => b[1] - a[1])

  for (const [color] of colorsByCount) {
    if (!isNeutral(color)) {
      const brightness = getColorBrightness(color)
      if (isDark && brightness > 80 && brightness < 220) return color
      if (!isDark && brightness > 40 && brightness < 200) return color
    }
  }

  // Default accent based on theme
  return isDark ? '#3b82f6' : '#2563eb'
}

// Generate theme based on extracted data
function generateTheme(
  isDark: boolean,
  backgrounds: string[],
  foregrounds: string[],
  accentColor: string,
  siteName: string
) {
  // Determine primary background
  let bgColor: string
  let fgColor: string

  if (isDark) {
    // Find darkest background
    bgColor = backgrounds
      .filter(c => getColorBrightness(c) < 60)
      .sort((a, b) => getColorBrightness(a) - getColorBrightness(b))[0] || '#0a0a0a'

    // Find lightest foreground for contrast
    fgColor = foregrounds
      .filter(c => getColorBrightness(c) > 180)
      .sort((a, b) => getColorBrightness(b) - getColorBrightness(a))[0] || '#fafafa'
  } else {
    // Find lightest background
    bgColor = backgrounds
      .filter(c => getColorBrightness(c) > 200)
      .sort((a, b) => getColorBrightness(b) - getColorBrightness(a))[0] || '#ffffff'

    // Find darkest foreground for contrast
    fgColor = foregrounds
      .filter(c => getColorBrightness(c) < 80)
      .sort((a, b) => getColorBrightness(a) - getColorBrightness(b))[0] || '#171717'
  }

  // Get hue from accent color for coordinated theme
  const accentHue = getColorHue(accentColor)
  // For neutral primary, use a subtle hue or the accent hue
  const primaryHue = isNeutral(bgColor) ? accentHue : getColorHue(bgColor)

  return {
    id: 'custom-cloned',
    name: siteName,
    description: `Inspired by ${siteName}`,
    isDark,
    preview: {
      primary: isDark ? '#171717' : '#ffffff',
      accent: accentColor,
      bg: bgColor
    },
    colors: {
      background: bgColor,
      foreground: fgColor,
      accent: accentColor,
      accentHue,
      primaryHue,
    },
    light: {
      background: 'oklch(0.99 0.005 0)',
      foreground: 'oklch(0.15 0.01 0)',
      card: 'oklch(1 0 0)',
      cardForeground: 'oklch(0.15 0.01 0)',
      popover: 'oklch(1 0 0)',
      popoverForeground: 'oklch(0.15 0.01 0)',
      primary: 'oklch(0.20 0.01 0)',
      primaryForeground: 'oklch(0.98 0.005 0)',
      secondary: 'oklch(0.96 0.005 0)',
      secondaryForeground: 'oklch(0.25 0.01 0)',
      muted: 'oklch(0.96 0.005 0)',
      mutedForeground: 'oklch(0.45 0.01 0)',
      accent: `oklch(0.55 0.20 ${accentHue})`,
      accentForeground: 'oklch(0.98 0.005 0)',
      border: 'oklch(0.92 0.005 0)',
      input: 'oklch(0.92 0.005 0)',
      ring: `oklch(0.55 0.20 ${accentHue})`,
    },
    dark: {
      background: 'oklch(0.10 0.005 0)',
      foreground: 'oklch(0.95 0.005 0)',
      card: 'oklch(0.14 0.005 0)',
      cardForeground: 'oklch(0.95 0.005 0)',
      popover: 'oklch(0.14 0.005 0)',
      popoverForeground: 'oklch(0.95 0.005 0)',
      primary: 'oklch(0.95 0.005 0)',
      primaryForeground: 'oklch(0.10 0.005 0)',
      secondary: 'oklch(0.20 0.005 0)',
      secondaryForeground: 'oklch(0.90 0.005 0)',
      muted: 'oklch(0.20 0.005 0)',
      mutedForeground: 'oklch(0.65 0.005 0)',
      accent: `oklch(0.65 0.18 ${accentHue})`,
      accentForeground: 'oklch(0.10 0.005 0)',
      border: 'oklch(0.25 0.005 0)',
      input: 'oklch(0.25 0.005 0)',
      ring: `oklch(0.65 0.18 ${accentHue})`,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the website
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch website' }, { status: 400 })
    }

    const html = await response.text()
    let allCss = ''

    // Extract inline styles
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
    let styleMatch
    while ((styleMatch = styleRegex.exec(html)) !== null) {
      allCss += styleMatch[1] + '\n'
    }

    // Extract CSS from style attributes
    const styleAttrRegex = /style="([^"]+)"/gi
    let attrMatch
    while ((attrMatch = styleAttrRegex.exec(html)) !== null) {
      allCss += attrMatch[1] + '\n'
    }

    // Try to fetch main CSS files (limit to first 5)
    const cssLinkRegex = /<link[^>]+href="([^"]+\.css[^"]*)"/gi
    const cssUrls: string[] = []
    let linkMatch
    while ((linkMatch = cssLinkRegex.exec(html)) !== null && cssUrls.length < 5) {
      let cssUrl = linkMatch[1]
      if (cssUrl.startsWith('//')) {
        cssUrl = 'https:' + cssUrl
      } else if (cssUrl.startsWith('/')) {
        cssUrl = parsedUrl.origin + cssUrl
      } else if (!cssUrl.startsWith('http')) {
        cssUrl = new URL(cssUrl, parsedUrl).toString()
      }
      cssUrls.push(cssUrl)
    }

    // Fetch CSS files in parallel
    const cssPromises = cssUrls.map(async (cssUrl) => {
      try {
        const cssResponse = await fetch(cssUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ThemeExtractor/1.0)' },
        })
        if (cssResponse.ok) {
          return await cssResponse.text()
        }
      } catch {
        // Ignore errors
      }
      return ''
    })

    const cssResults = await Promise.all(cssPromises)
    allCss += cssResults.join('\n')

    // Extract CSS variables
    const cssVars = extractCssVariables(allCss)

    // Extract colors with context
    const { backgrounds, foregrounds, accents, allColors } = extractColorsWithContext(html, allCss)

    // Detect if dark theme
    const isDark = detectDarkTheme(backgrounds, cssVars)

    // Find accent color
    const accentColor = findAccentColor(accents, allColors, isDark)

    // Extract fonts
    const fonts = extractFonts(allCss)

    // Generate theme
    const siteName = parsedUrl.hostname.replace('www.', '').split('.')[0]
    const capitalizedName = siteName.charAt(0).toUpperCase() + siteName.slice(1)
    const theme = generateTheme(isDark, backgrounds, foregrounds, accentColor, capitalizedName)

    return NextResponse.json({
      success: true,
      theme,
      fonts,
      colorsFound: allColors.size,
      isDark,
      debug: {
        backgroundsFound: backgrounds.length,
        foregroundsFound: foregrounds.length,
        accentsFound: accents.length,
        cssVarsFound: Object.keys(cssVars).length,
      }
    })

  } catch (error) {
    console.error('Theme extraction error:', error)
    return NextResponse.json({ error: 'Failed to extract theme' }, { status: 500 })
  }
}
