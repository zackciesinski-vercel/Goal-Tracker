import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { formatGoalsForSlack, postToSlack, getCurrentWeekNumber } from '@/lib/slack'
import { getCurrentFiscalPeriod } from '@/lib/fiscal'

// This endpoint is called by a cron job (e.g., Vercel Cron)
// It posts all users' goals to their org's Slack channel

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role key for cron jobs (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Get all organizations with slack webhooks configured
  const { data: orgsWithSettings, error: settingsError } = await supabase
    .from('org_settings')
    .select('organization_id, slack_webhook_url, fiscal_year_start_month')
    .not('slack_webhook_url', 'is', null)

  if (settingsError || !orgsWithSettings) {
    return NextResponse.json(
      { error: 'Failed to fetch org settings' },
      { status: 500 }
    )
  }

  const results: Array<{ orgId: string; usersPosted: number; error?: string }> = []

  for (const orgSettings of orgsWithSettings) {
    if (!orgSettings.slack_webhook_url) continue

    const fiscalStartMonth = orgSettings.fiscal_year_start_month || 2
    const { year, quarter } = getCurrentFiscalPeriod(fiscalStartMonth)

    // Get all members of this org
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id, user:users(name, email)')
      .eq('organization_id', orgSettings.organization_id)

    if (!members) continue

    let usersPosted = 0

    for (const member of members) {
      // Get this user's goals with updates
      const { data: goals } = await supabase
        .from('goals')
        .select('*, updates(*)')
        .eq('organization_id', orgSettings.organization_id)
        .eq('owner_id', member.user_id)
        .eq('year', year)
        .eq('quarter', quarter)
        .order('created_at', { ascending: true })

      if (!goals || goals.length === 0) continue

      const user = member.user as unknown as { name?: string; email: string } | null
      const userName = user?.name || user?.email?.split('@')[0] || 'Unknown'
      const weekNumber = getCurrentWeekNumber()

      const { blocks, text } = formatGoalsForSlack(goals, userName, weekNumber, fiscalStartMonth)
      const result = await postToSlack(orgSettings.slack_webhook_url, blocks, text)

      if (result.ok) {
        usersPosted++
      }
    }

    results.push({
      orgId: orgSettings.organization_id,
      usersPosted,
    })
  }

  return NextResponse.json({
    success: true,
    orgsProcessed: results.length,
    results,
  })
}
