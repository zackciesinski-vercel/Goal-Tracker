/**
 * Fiscal year utilities
 * Handles quarter calculations based on configurable fiscal year start month
 */

export interface FiscalPeriod {
  year: number
  quarter: number
}

export interface QuarterDates {
  start: Date
  end: Date
}

/**
 * Get the current fiscal year and quarter based on fiscal year start month
 * @param fiscalYearStartMonth - 1-12, the month the fiscal year starts (default Feb = 2)
 *
 * Fiscal year is named after the calendar year it ENDS in.
 * Example with Feb start: FY26 = Feb 2025 - Jan 2026
 */
export function getCurrentFiscalPeriod(fiscalYearStartMonth: number = 2): FiscalPeriod {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentYear = now.getFullYear()

  // Calculate fiscal year (named after the year it ends in)
  // If fiscal year starts in January, it matches calendar year
  // Otherwise: before fiscal start = end of FY (ends this year), at/after = start of new FY (ends next year)
  let fiscalYear: number
  if (fiscalYearStartMonth === 1) {
    fiscalYear = currentYear
  } else {
    fiscalYear = currentMonth >= fiscalYearStartMonth
      ? currentYear + 1  // Start of new FY that ends next calendar year
      : currentYear      // End of FY that ends this calendar year
  }

  // Calculate fiscal quarter (1-4)
  // Months since fiscal year start
  let monthsIntoFiscalYear = currentMonth - fiscalYearStartMonth
  if (monthsIntoFiscalYear < 0) {
    monthsIntoFiscalYear += 12
  }
  const fiscalQuarter = Math.floor(monthsIntoFiscalYear / 3) + 1

  return { year: fiscalYear, quarter: fiscalQuarter }
}

/**
 * Get the start and end dates for a specific fiscal quarter
 */
export function getQuarterDates(
  year: number,
  quarter: number,
  fiscalYearStartMonth: number = 2
): QuarterDates {
  // Calculate the starting month of the quarter (0-indexed for Date)
  const quarterStartMonth = ((fiscalYearStartMonth - 1) + (quarter - 1) * 3) % 12

  // Determine the year for the start date
  // If the quarter start month is before fiscal year start month, it's in the next calendar year
  const startYear = quarterStartMonth < fiscalYearStartMonth - 1 ? year + 1 : year

  const start = new Date(startYear, quarterStartMonth, 1)

  // End is 3 months later, minus one day
  const endMonth = (quarterStartMonth + 3) % 12
  const endYear = endMonth < quarterStartMonth ? startYear + 1 : startYear
  const end = new Date(endYear, endMonth, 0) // Day 0 of next month = last day of current month

  return { start, end }
}

/**
 * Get quarter label (e.g., "Q1 FY24")
 */
export function getQuarterLabel(year: number, quarter: number): string {
  const shortYear = year.toString().slice(-2)
  return `Q${quarter} FY${shortYear}`
}

/**
 * Get month names for a quarter
 */
export function getQuarterMonths(quarter: number, fiscalYearStartMonth: number = 2): string[] {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const startMonthIndex = ((fiscalYearStartMonth - 1) + (quarter - 1) * 3) % 12

  return [
    monthNames[startMonthIndex],
    monthNames[(startMonthIndex + 1) % 12],
    monthNames[(startMonthIndex + 2) % 12]
  ]
}

/**
 * Check if a goal is in the current or past period (should be locked)
 */
export function shouldBeLocked(
  goalYear: number,
  goalQuarter: number,
  fiscalYearStartMonth: number = 2
): boolean {
  const current = getCurrentFiscalPeriod(fiscalYearStartMonth)

  if (goalYear < current.year) return true
  if (goalYear === current.year && goalQuarter <= current.quarter) return true

  return false
}

/**
 * Get available future periods for goal creation
 */
export function getAvailablePeriods(fiscalYearStartMonth: number = 2): FiscalPeriod[] {
  const current = getCurrentFiscalPeriod(fiscalYearStartMonth)
  const periods: FiscalPeriod[] = []

  // Current quarter and next 4 quarters
  let year = current.year
  let quarter = current.quarter

  for (let i = 0; i < 5; i++) {
    periods.push({ year, quarter })
    quarter++
    if (quarter > 4) {
      quarter = 1
      year++
    }
  }

  return periods
}
