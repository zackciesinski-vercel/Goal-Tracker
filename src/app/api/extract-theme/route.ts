import { NextRequest, NextResponse } from 'next/server'

// Convert hex to OKLCH (approximate conversion)
function hexToOklch(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '')

  // Parse RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  // Convert to linear RGB
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)

  // Convert to XYZ
  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb

  // Convert to Lab
  const xn = 0.95047, yn = 1.0, zn = 1.08883
  const f = (t: number) => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16/116)

  const l = (116 * f(y / yn)) - 16
  const a = 500 * (f(x / xn) - f(y / yn))
  const bLab = 200 * (f(y / yn) - f(z / zn))

  // Approximate OKLCH values
  const L = Math.max(0, Math.min(1, l / 100))
  const C = Math.sqrt(a * a + bLab * bLab) / 150
  const H = ((Math.atan2(bLab, a) * 180 / Math.PI) + 360) % 360

  return `oklch(${L.toFixed(2)} ${C.toFixed(2)} ${Math.round(H)})`
}

// Extract colors from CSS/HTML content
function extractColors(html: string, css: string): string[] {
  const colors: Set<string> = new Set()

  // Match hex colors
  const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g
  const hexMatches = [...html.matchAll(hexRegex), ...css.matchAll(hexRegex)]

  for (const match of hexMatches) {
    let hex = match[1]
    // Expand 3-digit hex to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
    }
    colors.add('#' + hex.toLowerCase())
  }

  // Match rgb/rgba colors
  const rgbRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)/g
  const rgbMatches = [...html.matchAll(rgbRegex), ...css.matchAll(rgbRegex)]

  for (const match of rgbMatches) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0')
    const g = parseInt(match[2]).toString(16).padStart(2, '0')
    const b = parseInt(match[3]).toString(16).padStart(2, '0')
    colors.add('#' + r + g + b)
  }

  return Array.from(colors)
}

// Extract font families from CSS
function extractFonts(css: string): string[] {
  const fonts: Set<string> = new Set()

  const fontRegex = /font-family:\s*([^;}\n]+)/gi
  const matches = css.matchAll(fontRegex)

  for (const match of matches) {
    const fontList = match[1]
      .split(',')
      .map(f => f.trim().replace(/["']/g, ''))
      .filter(f => !f.includes('system') && !f.includes('sans-serif') && !f.includes('serif') && !f.includes('monospace'))

    fontList.forEach(f => fonts.add(f))
  }

  return Array.from(fonts).slice(0, 3)
}

// Analyze color for brightness
function getColorBrightness(hex: string): number {
  hex = hex.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

// Analyze color for saturation
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

// Score colors by vibrancy (for finding primary/accent colors)
function scoreColor(hex: string): number {
  const brightness = getColorBrightness(hex)
  const saturation = getColorSaturation(hex)

  // Prefer saturated colors that aren't too dark or too light
  const brightnessScore = brightness > 50 && brightness < 200 ? 1 : 0.3
  const saturationScore = saturation > 0.3 ? saturation * 2 : saturation

  return brightnessScore * saturationScore
}

// Generate a full theme from extracted colors
function generateTheme(colors: string[], siteName: string) {
  // Filter out very dark and very light colors
  const filteredColors = colors.filter(c => {
    const brightness = getColorBrightness(c)
    return brightness > 20 && brightness < 240
  })

  // Score and sort colors by vibrancy
  const scoredColors = filteredColors
    .map(c => ({ color: c, score: scoreColor(c) }))
    .sort((a, b) => b.score - a.score)

  // Pick primary (most vibrant) and accent (second most vibrant with different hue)
  const primary = scoredColors[0]?.color || '#6366f1'

  // Find accent that's visually different from primary
  let accent = scoredColors[1]?.color || '#38bdf8'
  for (let i = 1; i < scoredColors.length; i++) {
    const candidate = scoredColors[i].color
    const primaryHex = primary.replace('#', '')
    const candidateHex = candidate.replace('#', '')

    // Check if hues are different enough
    const pr = parseInt(primaryHex.slice(0, 2), 16)
    const pg = parseInt(primaryHex.slice(2, 4), 16)
    const pb = parseInt(primaryHex.slice(4, 6), 16)
    const cr = parseInt(candidateHex.slice(0, 2), 16)
    const cg = parseInt(candidateHex.slice(2, 4), 16)
    const cb = parseInt(candidateHex.slice(4, 6), 16)

    const diff = Math.abs(pr - cr) + Math.abs(pg - cg) + Math.abs(pb - cb)
    if (diff > 100) {
      accent = candidate
      break
    }
  }

  // Find a background color (very light)
  const bgColor = colors.find(c => getColorBrightness(c) > 240) || '#fafafa'

  const primaryOklch = hexToOklch(primary)
  const accentOklch = hexToOklch(accent)

  // Extract hue from primary for coordinated theme
  const primaryHue = parseInt(primaryOklch.match(/\d+\)$/)?.[0] || '265')
  const accentHue = parseInt(accentOklch.match(/\d+\)$/)?.[0] || '220')

  return {
    id: 'custom-cloned',
    name: siteName,
    description: `Inspired by ${siteName}`,
    preview: { primary, accent, bg: bgColor },
    colors: {
      primary,
      accent,
      primaryOklch,
      accentOklch,
      primaryHue,
      accentHue,
    },
    light: {
      background: `oklch(0.98 0.01 ${primaryHue})`,
      foreground: `oklch(0.20 0.03 ${primaryHue})`,
      card: 'oklch(1 0 0)',
      cardForeground: `oklch(0.20 0.03 ${primaryHue})`,
      popover: 'oklch(1 0 0)',
      popoverForeground: `oklch(0.20 0.03 ${primaryHue})`,
      primary: `oklch(0.55 0.20 ${primaryHue})`,
      primaryForeground: `oklch(0.98 0.01 ${primaryHue})`,
      secondary: `oklch(0.95 0.02 ${primaryHue})`,
      secondaryForeground: `oklch(0.35 0.10 ${primaryHue})`,
      muted: `oklch(0.96 0.02 ${primaryHue})`,
      mutedForeground: `oklch(0.50 0.03 ${primaryHue})`,
      accent: `oklch(0.70 0.15 ${accentHue})`,
      accentForeground: `oklch(0.18 0.02 ${accentHue})`,
      border: `oklch(0.91 0.02 ${primaryHue})`,
      input: `oklch(0.91 0.02 ${primaryHue})`,
      ring: `oklch(0.55 0.20 ${primaryHue})`,
    },
    dark: {
      background: `oklch(0.13 0.03 ${primaryHue})`,
      foreground: `oklch(0.96 0.01 ${primaryHue})`,
      card: `oklch(0.19 0.04 ${primaryHue})`,
      cardForeground: `oklch(0.96 0.01 ${primaryHue})`,
      popover: `oklch(0.19 0.04 ${primaryHue})`,
      popoverForeground: `oklch(0.96 0.01 ${primaryHue})`,
      primary: `oklch(0.68 0.18 ${primaryHue})`,
      primaryForeground: `oklch(0.13 0.03 ${primaryHue})`,
      secondary: `oklch(0.25 0.05 ${primaryHue})`,
      secondaryForeground: `oklch(0.92 0.01 ${primaryHue})`,
      muted: `oklch(0.25 0.05 ${primaryHue})`,
      mutedForeground: `oklch(0.68 0.02 ${primaryHue})`,
      accent: `oklch(0.75 0.12 ${accentHue})`,
      accentForeground: `oklch(0.13 0.02 ${accentHue})`,
      border: `oklch(0.29 0.04 ${primaryHue})`,
      input: `oklch(0.29 0.04 ${primaryHue})`,
      ring: `oklch(0.68 0.18 ${primaryHue})`,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the website
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThemeExtractor/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch website' }, { status: 400 })
    }

    const html = await response.text()

    // Extract inline styles and linked CSS URLs
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

    // Try to fetch main CSS files (limit to first 3)
    const cssLinkRegex = /<link[^>]+href="([^"]+\.css[^"]*)"/gi
    const cssUrls: string[] = []
    let linkMatch
    while ((linkMatch = cssLinkRegex.exec(html)) !== null && cssUrls.length < 3) {
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

    // Fetch CSS files
    for (const cssUrl of cssUrls) {
      try {
        const cssResponse = await fetch(cssUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ThemeExtractor/1.0)' },
        })
        if (cssResponse.ok) {
          allCss += await cssResponse.text() + '\n'
        }
      } catch {
        // Ignore CSS fetch errors
      }
    }

    // Extract colors and fonts
    const colors = extractColors(html, allCss)
    const fonts = extractFonts(allCss)

    // Generate theme
    const siteName = parsedUrl.hostname.replace('www.', '').split('.')[0]
    const capitalizedName = siteName.charAt(0).toUpperCase() + siteName.slice(1)
    const theme = generateTheme(colors, capitalizedName)

    return NextResponse.json({
      success: true,
      theme,
      fonts,
      colorsFound: colors.length,
    })

  } catch (error) {
    console.error('Theme extraction error:', error)
    return NextResponse.json({ error: 'Failed to extract theme' }, { status: 500 })
  }
}
